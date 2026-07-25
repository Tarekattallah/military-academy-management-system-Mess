import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, ArrowLeftRight } from 'lucide-react';
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
  getTransfers,
  getTransferById,
  createTransfer,
  getWarehouses,
  getAllProducts,
  getBatches,
} from '../../lib/api/entities';
import type { Transfer, TransferStatus } from '../../types/transfers';

const STATUS_LABELS: Record<TransferStatus, string> = {
  draft: 'مسودة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_VARIANTS: Record<TransferStatus, 'secondary' | 'success' | 'destructive'> = {
  draft: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
};

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  sourceBatch: z.string().min(1, 'الدفعة المصدر مطلوبة'),
  destinationBatchNumber: z.string().trim().min(1, 'رقم الدفعة الوجهة مطلوب'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
});

const transferSchema = z.object({
  sourceWarehouse: z.string().min(1, 'المستودع المصدر مطلوب'),
  destinationWarehouse: z.string().min(1, 'المستودع الوجهة مطلوب'),
  transferDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  items: z.array(itemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
});

type TransferFormValues = z.infer<typeof transferSchema>;

const emptyItem = {
  product: '',
  sourceBatch: '',
  destinationBatchNumber: '',
  quantity: 1,
};

const emptyForm: TransferFormValues = {
  sourceWarehouse: '',
  destinationWarehouse: '',
  transferDate: '',
  notes: '',
  items: [{ ...emptyItem }],
};

export function TransfersPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Transfer | null>(null);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDest, setSelectedDest] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canCreate = hasPermission('transfers:create');

  const { data: transfers = [], isLoading, error } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => getTransfers(),
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

  const { data: batches = [] } = useQuery({
    queryKey: ['batches', 'active'],
    queryFn: () => getBatches({ status: 'active' }),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (payload: TransferFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return createTransfer(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء التحويل بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء التحويل'),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: emptyForm,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

   const watchSource = watch('sourceWarehouse');
   // const watchItems = watch('items');

   const activeWarehouses = warehouses.filter((w) => w.isActive);

  const filteredBatches = batches.filter((b) => {
    if (watchSource && b.warehouse._id !== watchSource) return false;
    return true;
  });

  function handleOpenCreate() {
    reset(emptyForm);
    setOpen(true);
  }

  function handleView(id: string) {
    getTransferById(id)
      .then((t) => setViewTarget(t))
      .catch(() => toast.error('فشل تحميل تفاصيل التحويل'));
  }

  function onSubmit(values: TransferFormValues) {
    if (!user) return;
    createMutation.mutate(values);
  }

  const filteredTransfers = transfers.filter((t) => {
    if (selectedSource && t.sourceWarehouse._id !== selectedSource) return false;
    if (selectedDest && t.destinationWarehouse._id !== selectedDest) return false;
    if (selectedStatus && t.status !== selectedStatus) return false;
    return true;
  });

  const columns = [
    {
      accessorKey: 'transferNumber',
      header: 'رقم التحويل',
      cell: ({ row }: { row: { original: Transfer } }) => (
        <span className="font-mono text-xs font-medium">{row.original.transferNumber}</span>
      ),
    },
    {
      accessorKey: 'sourceWarehouse',
      header: 'من مستودع',
      cell: ({ row }: { row: { original: Transfer } }) => row.original.sourceWarehouse.name,
    },
    {
      accessorKey: 'destinationWarehouse',
      header: 'إلى مستودع',
      cell: ({ row }: { row: { original: Transfer } }) => row.original.destinationWarehouse.name,
    },
    {
      accessorKey: 'transferDate',
      header: 'التاريخ',
      cell: ({ row }: { row: { original: Transfer } }) =>
        new Date(row.original.transferDate).toLocaleDateString('ar-EG'),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }: { row: { original: Transfer } }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'items',
      header: 'البنود',
      cell: ({ row }: { row: { original: Transfer } }) => (
        <span className="font-mono">{row.original.items.length}</span>
      ),
    },
    {
      accessorKey: 'createdBy',
      header: 'بواسطة',
      cell: ({ row }: { row: { original: Transfer } }) => row.original.createdBy.displayName,
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: Transfer } }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض">
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="التحويلات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة التحويلات</CardTitle>
          {canCreate && (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              تحويل جديد
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">كل المستودعات المصدر</option>
              {activeWarehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
            <select
              value={selectedDest}
              onChange={(e) => setSelectedDest(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">كل المستودعات الوجهة</option>
              {activeWarehouses.map((w) => (
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
          ) : filteredTransfers.length === 0 ? (
            <EmptyState
              title="لا توجد تحويلات"
              description="قم بإضافة تحويل جديد للبدء"
            />
          ) : (
            <DataTable columns={columns} data={filteredTransfers} searchKey="transferNumber" searchPlaceholder="بحث عن رقم التحويل..." />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="تحويل جديد"
        description="إدخال بيانات التحويل بين المستودعات"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="transfer-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }
      >
        <form id="transfer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              control={control}
              name="sourceWarehouse"
              label="المستودع المصدر"
              required
              placeholder="اختر المستودع المصدر"
              options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
              error={errors.sourceWarehouse?.message}
            />
            <SelectField
              control={control}
              name="destinationWarehouse"
              label="المستودع الوجهة"
              required
              placeholder="اختر المستودع الوجهة"
              options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
              error={errors.destinationWarehouse?.message}
            />
          </div>

          <FormField label="تاريخ التحويل">
            <Input type="date" {...register('transferDate')} />
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
                <ArrowLeftRight className="size-4" />
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
                  <SelectField
                    control={control}
                    name={`items.${index}.sourceBatch`}
                    label="الدفعة المصدر"
                    required
                    placeholder="اختر الدفعة"
                    options={filteredBatches.map((b) => ({ value: b._id, label: `${b.batchNumber} (${b.availableQuantity})` }))}
                    error={errors.items?.[index]?.sourceBatch?.message}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="رقم الدفعة الوجهة" required error={errors.items?.[index]?.destinationBatchNumber?.message}>
                    <Input {...register(`items.${index}.destinationBatchNumber`)} placeholder="رقم الدفعة في الوجهة" />
                  </FormField>
                  <FormField label="الكمية" required error={errors.items?.[index]?.quantity?.message}>
                    <Input type="number" min="1" step="1" {...register(`items.${index}.quantity`)} placeholder="1" />
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
        title="تفاصيل التحويل"
        description={viewTarget ? `رقم: ${viewTarget.transferNumber}` : ''}
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">رقم التحويل</p>
                <p className="text-sm font-mono font-medium">{viewTarget.transferNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الحالة</p>
                <Badge variant={STATUS_VARIANTS[viewTarget.status]}>
                  {STATUS_LABELS[viewTarget.status]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">من مستودع</p>
                <p className="text-sm font-medium">{viewTarget.sourceWarehouse.name} ({viewTarget.sourceWarehouse.code})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إلى مستودع</p>
                <p className="text-sm font-medium">{viewTarget.destinationWarehouse.name} ({viewTarget.destinationWarehouse.code})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="text-sm">{new Date(viewTarget.transferDate).toLocaleDateString('ar-EG')}</p>
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
                      <span>الدفعة المصدر: <span className="font-mono">{item.sourceBatch.batchNumber}</span></span>
                      <span>دفعة الوجهة: <span className="font-mono">{item.destinationBatchNumber}</span></span>
                      <span>الكمية: <span className="font-mono">{item.quantity}</span></span>
                      <span>التكلفة: <span className="font-mono">{item.unitCost.toFixed(2)} ر.س</span></span>
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
