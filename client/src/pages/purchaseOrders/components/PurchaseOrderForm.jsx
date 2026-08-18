import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PackagePlus, Trash2, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { SelectField } from '../../../components/ui/SelectField';
import { useQuery } from '@tanstack/react-query';
import { getPurchaseRequests } from '../../../lib/api/purchaseRequests';
import api from '../../../lib/api';

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  unitPrice: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالباً'),
  notes: z.string().trim().max(300).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v)
});

const purchaseOrderSchema = z.object({
  purchaseRequest: z.string().optional().or(z.literal('')).transform((v) => v === '' ? null : v),
  supplier: z.string().min(1, 'المورد مطلوب'),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  expectedDeliveryDate: z.string().optional().or(z.literal('')).transform((v) => v === '' ? null : v),
  notes: z.string().trim().max(1000).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  items: z.array(itemSchema).min(1, 'يجب إضافة صنف واحد على الأقل')
});

const emptyItem = { product: '', quantity: 1, unit: '', unitPrice: 0, notes: '' };

export function PurchaseOrderForm({ defaultValues, onSubmit, isSubmitting, onCancel }) {
  const { t } = useTranslation();
  
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: defaultValues || {
      purchaseRequest: '',
      supplier: '',
      warehouse: '',
      expectedDeliveryDate: '',
      notes: '',
      items: [{ ...emptyItem }]
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items'
  });

  const watchItems = watch('items');
  const watchPR = watch('purchaseRequest');
  
  const isLinkedToPR = !!watchPR;

  // Lookups
  const { data: prsResponse } = useQuery({
    queryKey: ['purchaseRequests', 'approved'],
    queryFn: () => getPurchaseRequests({ status: 'approved' })
  });
  
  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await api.get('/warehouses');
      return data.data;
    }
  });

  const { data: suppliersResponse } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/suppliers');
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

  const approvedPRs = useMemo(() => prsResponse || [], [prsResponse]);
  const warehouses = warehousesResponse || [];
  const suppliers = suppliersResponse || [];
  const products = productsResponse || [];
  
  const activeWarehouses = warehouses.filter((w) => w.isActive);
  const activeSuppliers = suppliers.filter((s) => s.isActive);
  const activeProducts = products.filter((p) => p.isActive);

  // Sync PR details when selected
  useEffect(() => {
    if (watchPR) {
      const selectedPR = approvedPRs.find(pr => pr._id === watchPR);
      if (selectedPR) {
        setValue('warehouse', selectedPR.warehouse?._id || selectedPR.warehouse);
        const mappedItems = selectedPR.items.map(item => ({
          product: item.product?._id || item.product,
          quantity: item.quantity,
          unit: item.unit?._id || item.unit,
          unitPrice: 0,
          notes: item.notes || ''
        }));
        replace(mappedItems);
      }
    } else if (!defaultValues) {
      // If PR is cleared, we don't necessarily clear items to avoid frustrating users, 
      // but they are now unlocked. 
    }
  }, [watchPR, approvedPRs, setValue, replace, defaultValues]);

  // Sync unit when product changes (only when not locked by PR)
  useEffect(() => {
    if (isLinkedToPR) return;
    
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
  }, [watch, activeProducts, setValue, isLinkedToPR]);

  return (
    <form id="purchase-order-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      
      {/* PR Linkage Header */}
      <div className="bg-muted/30 p-4 rounded-lg border border-border mb-4">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <Link className="size-4 text-muted-foreground" />
          <span>الربط بطلب شراء (اختياري)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            control={control}
            name="purchaseRequest"
            label={t('purchaseOrders.fields.purchaseRequest')}
            options={[{ value: '', label: 'بدون طلب شراء' }, ...approvedPRs.map((pr) => ({ value: pr._id, label: pr.requestNumber }))]}
            error={errors.purchaseRequest?.message}
          />
        </div>
        {isLinkedToPR && (
          <p className="text-xs text-muted-foreground mt-2">
            * تم قفل المستودع والأصناف والكميات لمطابقة طلب الشراء المعتمد.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SelectField
          control={control}
          name="supplier"
          label={t('purchaseOrders.fields.supplier')}
          required
          options={activeSuppliers.map((s) => ({ value: s._id, label: s.name }))}
          error={errors.supplier?.message}
        />
        <SelectField
          control={control}
          name="warehouse"
          label={t('purchaseOrders.fields.warehouse')}
          required
          disabled={isLinkedToPR}
          options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
          error={errors.warehouse?.message}
        />
        <FormField label="تاريخ التوصيل المتوقع" error={errors.expectedDeliveryDate?.message}>
          <Input type="date" {...register('expectedDeliveryDate')} />
        </FormField>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <FormField label={t('purchaseOrders.fields.notes')} error={errors.notes?.message}>
          <Input type="text" {...register('notes')} />
        </FormField>
      </div>

      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{t('purchaseOrders.fields.items')}</p>
          {!isLinkedToPR && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ ...emptyItem })}
            >
              <PackagePlus className="size-4 ml-2" />
              {t('purchaseOrders.actions.addItem')}
            </Button>
          )}
        </div>
        
        {errors.items?.root && (
          <p className="text-xs text-destructive">{errors.items.root.message}</p>
        )}

        <div className="space-y-2 max-h-[50vh] overflow-y-auto p-1">
          {fields.map((field, index) => {
            const selectedProductId = watchItems?.[index]?.product;
            const selectedProduct = activeProducts.find(p => p._id === selectedProductId);
            
            return (
              <div key={field.id} className="relative flex flex-col sm:flex-row gap-3 rounded-lg border border-border bg-card p-3">
                {!isLinkedToPR && (
                  <div className="absolute left-2 top-2 sm:static sm:mt-8">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                      title={t('purchaseOrders.actions.remove')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-6 sm:pt-0">
                  <div className="sm:col-span-3">
                    <SelectField
                      control={control}
                      name={`items.${index}.product`}
                      label={t('purchaseOrders.fields.product')}
                      required
                      disabled={isLinkedToPR}
                      options={activeProducts.map((p) => ({ value: p._id, label: p.name }))}
                      error={errors.items?.[index]?.product?.message}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label={t('purchaseOrders.fields.quantity')} required error={errors.items?.[index]?.quantity?.message}>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isLinkedToPR}
                        {...register(`items.${index}.quantity`)}
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-2">
                    <FormField label={t('purchaseOrders.fields.unit')} required error={errors.items?.[index]?.unit?.message}>
                      <Input
                        type="text"
                        disabled
                        value={selectedProduct?.unit?.name || ''}
                        placeholder={t('purchaseOrders.fields.unit')}
                        className="bg-muted"
                      />
                    </FormField>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <FormField label={t('purchaseOrders.fields.unitPrice')} required error={errors.items?.[index]?.unitPrice?.message}>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`)}
                      />
                    </FormField>
                  </div>

                  <div className="sm:col-span-3">
                    <FormField label={t('purchaseOrders.fields.notes')} error={errors.items?.[index]?.notes?.message}>
                      <Input
                        type="text"
                        disabled={isLinkedToPR}
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

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('purchaseOrders.actions.cancelAction')}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {defaultValues ? t('purchaseOrders.actions.edit') : t('purchaseOrders.create')}
        </Button>
      </div>
    </form>
  );
}
