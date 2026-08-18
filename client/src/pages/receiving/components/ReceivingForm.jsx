import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { SelectField } from '../../../components/ui/SelectField';
import { useQuery } from '@tanstack/react-query';
import { getPurchaseOrders } from '../../../lib/api/purchaseOrders';

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  batchNumber: z.string().trim().min(1, 'رقم التشغيلة مطلوب').max(100),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
  unitCost: z.coerce.number().min(0, 'التكلفة يجب أن تكون 0 أو أكثر').optional(),
  manufacturingDate: z.string().optional().or(z.literal('')).transform((v) => v === '' ? null : v),
  expiryDate: z.string().optional().or(z.literal('')).transform((v) => v === '' ? null : v),
});

const receivingSchema = z.object({
  purchaseOrder: z.string().min(1, 'أمر الشراء مطلوب'),
  supplier: z.string().min(1, 'المورد مطلوب'),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  receivingDate: z.string().optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  items: z.array(itemSchema).min(1, 'يجب استلام صنف واحد على الأقل')
});

export function ReceivingForm({ onSubmit, isSubmitting, onCancel }) {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(receivingSchema),
    defaultValues: {
      purchaseOrder: '',
      supplier: '',
      warehouse: '',
      receivingDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: []
    }
  });

  const { fields, replace: replaceItems } = useFieldArray({
    control,
    name: 'items'
  });

  const watchPO = watch('purchaseOrder');
  const watchItems = watch('items');

  const { data: posResponse } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => getPurchaseOrders()
  });

  const pos = posResponse || [];
  // Only POs that are approved or partially received are eligible for receiving
  const eligiblePOs = pos.filter(po => ['approved', 'partially_received'].includes(po.status));
  const selectedPO = eligiblePOs.find(po => po._id === watchPO);

  useEffect(() => {
    if (selectedPO) {
      setValue('supplier', selectedPO.supplier?._id || selectedPO.supplier);
      setValue('warehouse', selectedPO.warehouse?._id || selectedPO.warehouse);
      
      const mappedItems = selectedPO.items
        .filter(item => item.remainingQuantity > 0)
        .map(item => ({
          product: item.product?._id || item.product,
          _productObj: item.product,
          _unitObj: item.unit,
          _remainingQuantity: item.remainingQuantity,
          _orderedQuantity: item.quantity,
          _previouslyReceived: item.receivedQuantity,
          batchNumber: '',
          quantity: item.remainingQuantity,
          unitCost: item.unitPrice || 0,
          manufacturingDate: '',
          expiryDate: ''
        }));
      
      replaceItems(mappedItems);
    } else {
      setValue('supplier', '');
      setValue('warehouse', '');
      replaceItems([]);
    }
  }, [selectedPO, setValue, replaceItems]);

  const onFormSubmit = (data) => {
    // Strip frontend-only fields before sending to backend
    const sanitizedData = {
      ...data,
      items: data.items.map(item => ({
        product: item.product,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        unitCost: item.unitCost,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate
      }))
    };
    onSubmit(sanitizedData);
  };

  return (
    <form id="receiving-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      
      <div className="bg-muted/30 p-4 rounded-lg border border-border mb-4">
        <SelectField
          control={control}
          name="purchaseOrder"
          label={t('receiving.fields.purchaseOrder')}
          required
          options={[{ value: '', label: 'اختر أمر الشراء' }, ...eligiblePOs.map((po) => ({ value: po._id, label: po.orderNumber }))]}
          error={errors.purchaseOrder?.message}
        />
        {selectedPO && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t('receiving.fields.supplier')}</p>
              <p className="font-medium">{selectedPO.supplier?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('receiving.fields.warehouse')}</p>
              <p className="font-medium">{selectedPO.warehouse?.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label={t('receiving.fields.receivingDate')} error={errors.receivingDate?.message}>
          <Input type="date" {...register('receivingDate')} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <FormField label={t('receiving.fields.notes')} error={errors.notes?.message}>
          <Input type="text" {...register('notes')} />
        </FormField>
      </div>

      {selectedPO && fields.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t('receiving.fields.items')}</p>
          </div>
          
          {errors.items?.root && (
            <p className="text-xs text-destructive">{errors.items.root.message}</p>
          )}

          <div className="space-y-4 max-h-[45vh] overflow-y-auto p-1 pr-2">
            {fields.map((field, index) => {
              const itemContext = watchItems[index] || {};
              const product = itemContext._productObj;
              const unit = itemContext._unitObj;
              
              return (
                <div key={field.id} className="relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex justify-between items-start border-b border-border pb-3 mb-1">
                    <div>
                      <h4 className="font-semibold">{product?.name || '-'}</h4>
                      <p className="text-xs text-muted-foreground">{t('receiving.fields.unit')}: {unit?.name || '-'}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-right">
                      <div>
                        <p className="text-muted-foreground">{t('receiving.fields.orderedQuantity')}</p>
                        <p className="font-medium">{itemContext._orderedQuantity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('receiving.fields.previouslyReceived')}</p>
                        <p className="font-medium text-success">{itemContext._previouslyReceived}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('receiving.fields.remainingQuantity')}</p>
                        <p className="font-medium text-warning">{itemContext._remainingQuantity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label={t('receiving.fields.receivingQuantity')} required error={errors.items?.[index]?.quantity?.message}>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={itemContext._remainingQuantity}
                        {...register(`items.${index}.quantity`)}
                      />
                    </FormField>

                    <FormField label={t('receiving.fields.batchNumber')} required error={errors.items?.[index]?.batchNumber?.message}>
                      <Input type="text" {...register(`items.${index}.batchNumber`)} />
                    </FormField>

                    <FormField label={t('receiving.fields.unitCost')} error={errors.items?.[index]?.unitCost?.message}>
                      <Input type="number" step="0.01" min="0" {...register(`items.${index}.unitCost`)} />
                    </FormField>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label={t('receiving.fields.manufacturingDate')} error={errors.items?.[index]?.manufacturingDate?.message}>
                      <Input type="date" {...register(`items.${index}.manufacturingDate`)} />
                    </FormField>
                    
                    <FormField label={t('receiving.fields.expiryDate')} error={errors.items?.[index]?.expiryDate?.message}>
                      <Input type="date" {...register(`items.${index}.expiryDate`)} />
                    </FormField>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPO && fields.length === 0 && (
        <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-border border-dashed">
          <p>جميع أصناف هذا الأمر مستلمة بالكامل.</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('receiving.actions.cancelAction')}
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!selectedPO || fields.length === 0}>
          {t('receiving.actions.create')}
        </Button>
      </div>
    </form>
  );
}
