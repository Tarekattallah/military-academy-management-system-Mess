import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, PackagePlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { SelectField } from '../../components/ui/SelectField';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  getReceivings,
  getReceivingById,
  createReceiving,
  getSuppliers,
  getWarehouses,
  getAllProducts,
} from '../../lib/api/entities';
import type { Receiving, ReceivingStatus, ReceivingItemFormValues } from '../../types/receiving';

const STATUS_LABELS: Record<ReceivingStatus, string> = {
  draft: 'مسودة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_VARIANTS: Record<ReceivingStatus, 'secondary' | 'success' | 'destructive'> = {
  draft: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
};

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  batchNumber: z.string().trim().min(1, 'رقم الدفعة مطلوب').max(100),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
  unitCost: z.coerce.number().min(0).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  manufacturingDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
});

const receivingSchema = z.object({
  supplier: z.string().min(1, 'المورد مطلوب'),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  receivingDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  items: z.array(itemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
});

type ReceivingFormValues = z.infer<typeof receivingSchema>;

const emptyItem: ReceivingItemFormValues = {
  product: '',
  batchNumber: '',
  quantity: 1,
  unitCost: undefined,
  manufacturingDate: '',
  expiryDate: '',
};

const emptyForm: ReceivingFormValues = {
  supplier: '',
  warehouse: '',
  receivingDate: '',
  notes: '',
  items: [{ ...emptyItem }],
};

export function ReceivingPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Receiving | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canCreate = hasPermission('receiving:create');

  const { data: receivings = [], isLoading, error } = useQuery({
    queryKey: ['receivings'],
    queryFn: () => getReceivings(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: getAllProducts,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (payload: ReceivingFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return createReceiving(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivings'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء استلام البضائع بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء استلام البضائع'),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ReceivingFormValues>({
    resolver: zodResolver(receivingSchema) as any,
    defaultValues: emptyForm,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // const watchItems = watch('items');

  function handleOpenCreate() {
    reset(emptyForm);
    setOpen(true);
  }

  function handleView(id: string) {
    getReceivingById(id)
      .then((r) => setViewTarget(r))
      .catch(() => toast.error('فشل تحميل تفاصيل الاستلام'));
  }

  function onSubmit(values: ReceivingFormValues) {
    if (!user) return;
    createMutation.mutate(values);
  }

  const filteredReceivings = receivings.filter((r) => {
    if (selectedSupplier && r.supplier._id !== selectedSupplier) return false;
    if (selectedWarehouse && r.warehouse._id !== selectedWarehouse) return false;
    if (selectedStatus && r.status !== selectedStatus) return false;
    return true;
  });

  const columns = [
    {
      accessorKey: 'receivingNumber',
      header: 'رقم الاستلام',
      cell: ({ row }: { row: { original: Receiving } }) => (
        <span className="font-mono text-xs font-medium">{row.original.receivingNumber}</span>
      ),
    },
    {
      accessorKey: 'supplier',
      header: 'المورد',
      cell: ({ row }: { row: { original: Receiving } }) => row.original.supplier.name,
    },
    {
      accessorKey: 'warehouse',
      header: 'المستودع',
      cell: ({ row }: { row: { original: Receiving } }) => row.original.warehouse.name,
    },
    {
      accessorKey: 'receivingDate',
      header: 'التاريخ',
      cell: ({ row }: { row: { original: Receiving } }) =>
        new Date(row.original.receivingDate).toLocaleDateString('ar-EG'),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }: { row: { original: Receiving } }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'items',
      header: 'البنود',
      cell: ({ row }: { row: { original: Receiving } }) => (
        <span className="font-mono">{row.original.items.length}</span>
      ),
    },
    {
      accessorKey: 'createdBy',
      header: 'بواسطة',
      cell: ({ row }: { row: { original: Receiving } }) => row.original.createdBy.displayName,
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: Receiving } }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض">
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="استلام البضائع">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة استلام البضائع</CardTitle>
          {canCreate && (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              استلام جديد
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">كل الموردين</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">كل المستودعات</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8">فشل تحميل البيانات</div>
          ) : filteredReceivings.length === 0 ? (
            <EmptyState
              title="لا توجد استلامات"
              description="قم بإضافة استلام جديد للبدء"
            />
          ) : (
            <DataTable columns={columns} data={filteredReceivings} searchKey="receivingNumber" searchPlaceholder="بحث عن رقم الاستلام..." />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="استلام بضائع جديد"
        description="إدخال بيانات استلام البضائع"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="receiving-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }
      >
        <form id="receiving-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              control={control}
              name="supplier"
              label="المورد"
              required
              placeholder="اختر المورد"
              options={suppliers.filter((s) => s.isActive).map((s) => ({ value: s._id, label: s.name }))}
              error={errors.supplier?.message}
            />
            <SelectField
              control={control}
              name="warehouse"
              label="المستودع"
              required
              placeholder="اختر المستودع"
              options={warehouses.filter((w) => w.isActive).map((w) => ({ value: w._id, label: w.name }))}
              error={errors.warehouse?.message}
            />
          </div>

          <FormField label="تاريخ الاستلام">
            <Input type="date" {...register('receivingDate')} />
          </FormField>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">البنود</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ...emptyItem })}
              >
                <PackagePlus className="size-4" />
                إضافة بند
              </Button>
            </div>
            {errors.items?.root && (
              <p className="text-xs text-destructive">{errors.items.root.message}</p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">بند {index + 1}</p>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      title="حذف البند"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    control={control}
                    name={`items.${index}.product`}
                    label="المنتج"
                    required
                    placeholder="اختر المنتج"
                    options={products.filter((p) => p.isActive).map((p) => ({ value: p._id, label: p.name }))}
                    error={errors.items?.[index]?.product?.message}
                  />
                  <FormField label="رقم الدفعة" required error={errors.items?.[index]?.batchNumber?.message}>
                    <Input {...register(`items.${index}.batchNumber`)} placeholder="رقم الدفعة" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="الكمية" required error={errors.items?.[index]?.quantity?.message}>
                    <Input type="number" min="1" step="1" {...register(`items.${index}.quantity`)} placeholder="1" />
                  </FormField>
                  <FormField label="تكلفة الوحدة" error={errors.items?.[index]?.unitCost?.message}>
                    <Input type="number" min="0" step="0.01" {...register(`items.${index}.unitCost`)} placeholder="اختياري" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="تاريخ التصنيع">
                    <Input type="date" {...register(`items.${index}.manufacturingDate`)} />
                  </FormField>
                  <FormField label="تاريخ انتهاء الصلاحية">
                    <Input type="date" {...register(`items.${index}.expiryDate`)} />
                  </FormField>
                </div>
              </div>
            ))}
          </div>

          <FormField label="ملاحظات" error={errors.notes?.message}>
            <Input {...register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
          </FormField>
        </form>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title="تفاصيل استلام البضائع"
        description={viewTarget ? `رقم: ${viewTarget.receivingNumber}` : ''}
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">رقم الاستلام</p>
                <p className="text-sm font-mono font-medium">{viewTarget.receivingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الحالة</p>
                <Badge variant={STATUS_VARIANTS[viewTarget.status]}>
                  {STATUS_LABELS[viewTarget.status]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المورد</p>
                <p className="text-sm font-medium">{viewTarget.supplier.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المستودع</p>
                <p className="text-sm font-medium">{viewTarget.warehouse.name} ({viewTarget.warehouse.code})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="text-sm">{new Date(viewTarget.receivingDate).toLocaleDateString('ar-EG')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">بواسطة</p>
                <p className="text-sm">{viewTarget.createdBy.displayName}</p>
              </div>
            </div>

            {viewTarget.notes && (
              <div>
                <p className="text-xs text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{viewTarget.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-2">البنود ({viewTarget.items.length})</p>
              <div className="space-y-2">
                {viewTarget.items.map((item, index) => (
                  <div key={index} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.product.name}</p>
                      <span className="font-mono text-xs">{item.product.sku}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>الدفعة: <span className="font-mono">{item.batchNumber}</span></span>
                      <span>الكمية: <span className="font-mono">{item.quantity}</span></span>
                      {item.unitCost ? <span>التكلفة: <span className="font-mono">{item.unitCost.toFixed(2)} ر.س</span></span> : null}
                      {item.manufacturingDate ? <span>تصنيع: {new Date(item.manufacturingDate).toLocaleDateString('ar-EG')}</span> : null}
                      {item.expiryDate ? <span>انتهاء: {new Date(item.expiryDate).toLocaleDateString('ar-EG')}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </AppLayout>
  );
}
