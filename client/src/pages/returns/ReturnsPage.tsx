import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, ArrowLeftRight, XCircle } from 'lucide-react';
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
  getReturns,
  getReturnById,
  createReturn,
  cancelReturn,
  getWarehouses,
  getSuppliers,
  getAllProducts,
  getBatches,
} from '../../lib/api/entities';
import type { Return, ReturnStatus } from '../../types/returns';

const STATUS_LABELS: Record<ReturnStatus, string> = {
  draft: 'مسودة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_VARIANTS: Record<ReturnStatus, 'secondary' | 'success' | 'destructive'> = {
  draft: 'secondary',
  completed: 'success',
  cancelled: 'destructive',
};

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  batch: z.string().min(1, 'الدفعة مطلوبة'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
});

const returnSchema = z.object({
  returnType: z.enum(['return_to_supplier', 'internal_return'], { required_error: 'نوع الإرجاع مطلوب' }),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  supplier: z.string().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  referenceType: z.string().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  referenceId: z.string().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  returnDate: z.string().optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  reason: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  items: z.array(itemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

const emptyItem = { product: '', batch: '', quantity: 1 };

const emptyForm: ReturnFormValues = {
  returnType: 'return_to_supplier',
  warehouse: '',
  supplier: '',
  referenceType: '',
  referenceId: '',
  returnDate: '',
  reason: '',
  notes: '',
  items: [{ ...emptyItem }],
};

export function ReturnsPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Return | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Return | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedRType, setSelectedRType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canCreate = hasPermission('returns:create');
  const canDelete = hasPermission('returns:delete');

  const { data: returns = [], isLoading, error } = useQuery({
    queryKey: ['returns'],
    queryFn: () => getReturns(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: open,
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
    mutationFn: (payload: ReturnFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return createReturn(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء الإرجاع بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء الإرجاع'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelReturn(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      setCancelTarget(null);
      setCancelReason('');
      toast.success('تم إلغاء الإرجاع بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إلغاء الإرجاع'),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: emptyForm,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchRType = watch('returnType');
  const activeWarehouses = warehouses.filter((w) => w.isActive);

  function handleOpenCreate() {
    reset(emptyForm);
    setOpen(true);
  }

  function handleView(id: string) {
    getReturnById(id)
      .then((r) => setViewTarget(r))
      .catch(() => toast.error('فشل تحميل تفاصيل الإرجاع'));
  }

  function onSubmit(values: ReturnFormValues) {
    if (!user) return;
    createMutation.mutate(values);
  }

  const filteredReturns = returns.filter((r) => {
    if (selectedWarehouse && r.warehouse._id !== selectedWarehouse) return false;
    if (selectedRType && r.returnType !== selectedRType) return false;
    if (selectedStatus && r.status !== selectedStatus) return false;
    return true;
  });

  const columns = [
    {
      accessorKey: 'returnNumber',
      header: 'رقم الإرجاع',
      cell: ({ row }: { row: { original: Return } }) => (
        <span className="font-mono text-xs font-medium">{row.original.returnNumber}</span>
      ),
    },
    {
      accessorKey: 'returnType',
      header: 'النوع',
      cell: ({ row }: { row: { original: Return } }) => (
        <Badge>{row.original.returnType === 'return_to_supplier' ? 'إرجاع لمورد' : 'إرجاع داخلي'}</Badge>
      ),
    },
    {
      accessorKey: 'warehouse',
      header: 'المستودع',
      cell: ({ row }: { row: { original: Return } }) => row.original.warehouse.name,
    },
    { accessorKey: 'returnDate', header: 'التاريخ', cell: ({ row }: { row: { original: Return } }) => new Date(row.original.returnDate).toLocaleDateString('ar-EG') },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }: { row: { original: Return } }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge>
      ),
    },
    { accessorKey: 'items', header: 'البنود', cell: ({ row }: { row: { original: Return } }) => <span className="font-mono">{row.original.items.length}</span> },
    { accessorKey: 'createdBy', header: 'بواسطة', cell: ({ row }: { row: { original: Return } }) => row.original.createdBy.displayName },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: Return } }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض">
            <Eye className="size-4" />
          </Button>
          {canDelete && row.original.status === 'completed' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCancelTarget(row.original)}
              title="إلغاء"
              className="text-destructive hover:text-destructive"
            >
              <XCircle className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="المرتجعات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة المرتجعات</CardTitle>
          {canCreate && (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              إرجاع جديد
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل المستودعات</option>
              {activeWarehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <select value={selectedRType} onChange={(e) => setSelectedRType(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل الأنواع</option>
              <option value="return_to_supplier">إرجاع لمورد</option>
              <option value="internal_return">إرجاع داخلي</option>
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />)}</div>
          ) : error ? (
            <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div>
          ) : filteredReturns.length === 0 ? (
            <EmptyState title="لا توجد مرتجعات" description="قم بإضافة إرجاع جديد للبدء" />
          ) : (
            <DataTable columns={columns} data={filteredReturns} searchKey="returnNumber" searchPlaceholder="بحث عن رقم الإرجاع..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="إرجاع جديد" description="إدخال بيانات الإرجاع"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>إلغاء</Button>
          <Button form="return-form" type="submit" isLoading={createMutation.isPending}>حفظ</Button>
        </div>}
      >
        <form id="return-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField control={control} name="returnType" label="نوع الإرجاع" required placeholder="اختر النوع"
              options={[{ value: 'return_to_supplier', label: 'إرجاع لمورد' }, { value: 'internal_return', label: 'إرجاع داخلي' }]}
              error={errors.returnType?.message}
            />
            <SelectField control={control} name="warehouse" label="المستودع" required placeholder="اختر المستودع"
              options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
              error={errors.warehouse?.message}
            />
          </div>

          {watchRType === 'return_to_supplier' && (
            <SelectField control={control} name="supplier" label="المورد" placeholder="اختر المورد"
              options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
              error={errors.supplier?.message}
            />
          )}

          {watchRType === 'internal_return' && (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="نوع المرجع">
                <Input {...register('referenceType')} placeholder="Transfer" />
              </FormField>
              <FormField label="معرف المرجع">
                <Input {...register('referenceId')} placeholder="معرف التحويل" />
              </FormField>
            </div>
          )}

          <FormField label="تاريخ الإرجاع">
            <Input type="date" {...register('returnDate')} />
          </FormField>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">البنود</p>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                <ArrowLeftRight className="size-4" /> إضافة بند
              </Button>
            </div>
            {errors.items?.root && <p className="text-xs text-destructive">{errors.items.root.message}</p>}
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">بند {index + 1}</p>
                  {fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} title="حذف البند"><Trash2 className="size-4 text-destructive" /></Button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField control={control} name={`items.${index}.product`} label="المنتج" required placeholder="اختر المنتج"
                    options={products.filter((p) => p.isActive).map((p) => ({ value: p._id, label: p.name }))}
                    error={errors.items?.[index]?.product?.message}
                  />
                  <SelectField control={control} name={`items.${index}.batch`} label="الدفعة" required placeholder="اختر الدفعة"
                    options={batches.map((b) => ({ value: b._id, label: `${b.batchNumber} (${b.availableQuantity})` }))}
                    error={errors.items?.[index]?.batch?.message}
                  />
                </div>
                <FormField label="الكمية" required error={errors.items?.[index]?.quantity?.message}>
                  <Input type="number" min="1" step="1" {...register(`items.${index}.quantity`)} placeholder="1" />
                </FormField>
              </div>
            ))}
          </div>

          <FormField label="السبب" error={errors.reason?.message}>
            <Input {...register('reason')} placeholder="سبب الإرجاع (اختياري)" />
          </FormField>
          <FormField label="ملاحظات" error={errors.notes?.message}>
            <Input {...register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
          </FormField>
        </form>
      </Dialog>

      <Dialog open={!!viewTarget} onOpenChange={(v) => !v && setViewTarget(null)}
        title="تفاصيل الإرجاع" description={viewTarget ? `رقم: ${viewTarget.returnNumber}` : ''}>
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">رقم الإرجاع</p><p className="text-sm font-mono font-medium">{viewTarget.returnNumber}</p></div>
              <div><p className="text-xs text-muted-foreground">النوع</p><Badge>{viewTarget.returnType === 'return_to_supplier' ? 'إرجاع لمورد' : 'إرجاع داخلي'}</Badge></div>
              <div><p className="text-xs text-muted-foreground">المستودع</p><p className="text-sm font-medium">{viewTarget.warehouse.name}</p></div>
              <div><p className="text-xs text-muted-foreground">الحالة</p><Badge variant={STATUS_VARIANTS[viewTarget.status]}>{STATUS_LABELS[viewTarget.status]}</Badge></div>
              <div><p className="text-xs text-muted-foreground">التاريخ</p><p className="text-sm">{new Date(viewTarget.returnDate).toLocaleDateString('ar-EG')}</p></div>
              <div><p className="text-xs text-muted-foreground">بواسطة</p><p className="text-sm">{viewTarget.createdBy.displayName}</p></div>
              {viewTarget.supplier && <div><p className="text-xs text-muted-foreground">المورد</p><p className="text-sm">{viewTarget.supplier.name}</p></div>}
            </div>
            {viewTarget.reason && <div><p className="text-xs text-muted-foreground">السبب</p><p className="text-sm">{viewTarget.reason}</p></div>}
            {viewTarget.notes && <div><p className="text-xs text-muted-foreground">ملاحظات</p><p className="text-sm">{viewTarget.notes}</p></div>}
            <div>
              <p className="text-xs text-muted-foreground mb-2">البنود ({viewTarget.items.length})</p>
              <div className="space-y-2">
                {viewTarget.items.map((item, index) => (
                  <div key={index} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between"><p className="font-medium">{item.product.name}</p><span className="font-mono text-xs">{item.product.sku}</span></div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>الدفعة: <span className="font-mono">{item.batch.batchNumber}</span></span>
                      <span>الكمية: <span className="font-mono">{item.quantity}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(v) => { if (!v) { setCancelTarget(null); setCancelReason(''); } }}
        title="إلغاء الإرجاع"
        description={cancelTarget ? `هل أنت متأكد من إلغاء الإرجاع ${cancelTarget.returnNumber}؟` : ''}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCancelTarget(null); setCancelReason(''); }} disabled={cancelMutation.isPending}>
              تراجع
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (cancelTarget) {
                  cancelMutation.mutate({ id: cancelTarget._id, reason: cancelReason || undefined });
                }
              }}
              isLoading={cancelMutation.isPending}
            >
              تأكيد الإلغاء
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">تحذير: هذا الإجراء لا يمكن التراجع عنه</p>
            <p className="mt-1 text-xs">سيتم عكس جميع حركات المخزون المرتبطة بهذا الإرجاع.</p>
          </div>
          {cancelTarget && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الإرجاع:</span>
                <span className="font-mono">{cancelTarget.returnNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">النوع:</span>
                <span>{cancelTarget.returnType === 'return_to_supplier' ? 'إرجاع لمورد' : 'إرجاع داخلي'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المستودع:</span>
                <span>{cancelTarget.warehouse.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">البنود:</span>
                <span>{cancelTarget.items.length}</span>
              </div>
            </div>
          )}
          <FormField label="سبب الإلغاء (اختياري)">
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ذكر سبب الإلغاء..."
            />
          </FormField>
        </div>
      </Dialog>
    </AppLayout>
  );
}
