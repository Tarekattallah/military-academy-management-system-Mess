import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackagePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { SelectField } from '../../../components/ui/SelectField';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v)
});

const purchaseRequestSchema = z.object({
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  items: z.array(itemSchema).min(1, 'يجب إضافة صنف واحد على الأقل')
});

const emptyItem = { product: '', quantity: 1, unit: '', notes: '' };

export function PurchaseRequestForm({ defaultValues, onSubmit, isSubmitting, onCancel }) {
  const { t } = useTranslation();
  
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: defaultValues || {
      warehouse: '',
      items: [{ ...emptyItem }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');

  // Queries for lookups
  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await api.get('/warehouses');
      return data.data;
    }
  });

  const { data: productsResponse } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products/all');
      return data.data;
    }
  });

  const warehouses = warehousesResponse || [];
  const products = productsResponse || [];
  const activeWarehouses = warehouses.filter((w) => w.isActive);
  const activeProducts = products.filter((p) => p.isActive);

  // Sync unit when product changes
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name?.startsWith('items.') && name?.endsWith('.product') && type === 'change') {
        const index = parseInt(name.split('.')[1], 10);
        const productId = value.items[index]?.product;
        const product = activeProducts.find((p) => p._id === productId);
        if (product && product.unit) {
          setValue(`items.${index}.unit`, product.unit._id || product.unit, {
            shouldValidate: true
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, activeProducts, setValue]);

  return (
    <form id="purchase-request-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          control={control}
          name="warehouse"
          label={t('purchaseRequests.fields.warehouse')}
          required
          options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
          error={errors.warehouse?.message}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('purchaseRequests.fields.items')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...emptyItem })}
          >
            <PackagePlus className="size-4 ml-2" />
            {t('purchaseRequests.actions.addItem')}
          </Button>
        </div>
        
        {errors.items?.root && (
          <p className="text-xs text-destructive">{errors.items.root.message}</p>
        )}

        <div className="space-y-2 max-h-[60vh] overflow-y-auto p-1">
          {fields.map((field, index) => {
            const selectedProductId = watchItems?.[index]?.product;
            const selectedProduct = activeProducts.find(p => p._id === selectedProductId);
            
            return (
              <div key={field.id} className="relative flex flex-col sm:flex-row gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="absolute left-2 top-2 sm:static sm:mt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                    title={t('purchaseRequests.actions.remove')}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-6 sm:pt-0">
                  <div className="sm:col-span-4">
                    <SelectField
                      control={control}
                      name={`items.${index}.product`}
                      label={t('purchaseRequests.fields.product')}
                      required
                      options={activeProducts.map((p) => ({ value: p._id, label: p.name }))}
                      error={errors.items?.[index]?.product?.message}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label={t('purchaseRequests.fields.quantity')} required error={errors.items?.[index]?.quantity?.message}>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.quantity`)}
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label={t('purchaseRequests.fields.unit')} required error={errors.items?.[index]?.unit?.message}>
                      <Input
                        type="text"
                        disabled
                        value={selectedProduct?.unit?.name || ''}
                        placeholder={t('purchaseRequests.fields.unit')}
                        className="bg-muted"
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-4">
                    <FormField label={t('purchaseRequests.fields.notes')} error={errors.items?.[index]?.notes?.message}>
                      <Input
                        type="text"
                        {...register(`items.${index}.notes`)}
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('purchaseRequests.actions.cancelAction')}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {defaultValues ? t('purchaseRequests.actions.edit') : t('purchaseRequests.create')}
        </Button>
      </div>
    </form>
  );
}
