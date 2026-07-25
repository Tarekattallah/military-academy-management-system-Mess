import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Pencil } from 'lucide-react';
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
  getBatches,
  getWarehouses,
  getAllProducts,
  getSuppliers,
  createBatch,
  updateBatch,
  deleteBatch,
} from '../../lib/api/entities';
import type { Batch, BatchStatus } from '../../types/batches';

const STATUS_LABELS: Record<BatchStatus, string> = {
  active: 'نشط',
  depleted: 'منتهي',
  expired: 'منتهي الصلاحية',
  quarantined: 'محجوز',
  archived: 'مؤرشف',
};

const STATUS_VARIANTS: Record<BatchStatus, 'success' | 'secondary' | 'destructive' | 'warning' | 'default'> = {
  active: 'success',
  depleted: 'secondary',
  expired: 'destructive',
  quarantined: 'warning',
  archived: 'default',
};

const batchSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  batchNumber: z.string().trim().min(1, 'رقم الدفعة مطلوب').max(100),
  lotNumber: z.string().trim().max(100).optional().or(z.literal('')),
  manufacturingDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  initialQuantity: z.coerce.number().min(0, 'يجب أن تكون 0 أو أكثر'),
  unitCost: z.coerce.number().min(0).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  supplier: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
});

type BatchFormValues = z.infer<typeof batchSchema>;

const emptyForm: BatchFormValues = {
  product: '',
  warehouse: '',
  batchNumber: '',
  lotNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  initialQuantity: 0,
  unitCost: undefined,
  supplier: '',
  notes: '',
};

export function BatchesPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Batch | null>(null);
  const [viewTarget, setViewTarget] = useState<Batch | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBStatus, setSelectedBStatus] = useState('');

  const canCreate = hasPermission('batches:create');
  const canUpdate = hasPermission('batches:update');
  const canDelete = hasPermission('batches:delete');

  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatches(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: getAllProducts,
    enabled: open || !!editTarget,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
    enabled: open || !!editTarget,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: open || !!editTarget,
  });

  const createMutation = useMutation({
    mutationFn: (payload: BatchFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return createBatch(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء الدفعة بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء الدفعة'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BatchFormValues> }) => {
      if (!user) throw new Error('User not authenticated');
      return updateBatch(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setEditTarget(null);
      reset(emptyForm);
      toast.success('تم تحديث الدفعة بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل تحديث الدفعة'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      toast.success('تم حذف الدفعة بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل حذف الدفعة'),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema) as any,
    defaultValues: emptyForm,
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleOpenCreate() {
    reset(emptyForm);
    setEditTarget(null);
    setOpen(true);
  }

  function handleEdit(batch: Batch) {
    reset({
      product: batch.product._id,
      warehouse: batch.warehouse._id,
      batchNumber: batch.batchNumber,
      lotNumber: batch.lotNumber || '',
      manufacturingDate: batch.manufacturingDate ? batch.manufacturingDate.split('T')[0] : '',
      expiryDate: batch.expiryDate ? batch.expiryDate.split('T')[0] : '',
      initialQuantity: batch.initialQuantity,
      unitCost: batch.unitCost,
      supplier: batch.supplier?._id || '',
      notes: batch.notes || '',
    });
    setEditTarget(batch);
    setOpen(true);
  }

  function handleView(id: string) {
    const batch = batches.find((b) => b._id === id);
    if (batch) setViewTarget(batch);
  }

  function handleDelete(id: string) {
    if (confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      deleteMutation.mutate(id);
    }
  }

  function onSubmit(values: BatchFormValues) {
    if (!user) return;
    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const filtered = batches.filter((b) => {
    if (selectedProduct && b.product._id !== selectedProduct) return false;
    if (selectedWarehouse && b.warehouse._id !== selectedWarehouse) return false;
    if (selectedBStatus && b.status !== selectedBStatus) return false;
    return true;
  });

  const activeProducts = products.filter((p) => p.isActive);
  const activeWarehouses = warehouses.filter((w) => w.isActive);

  const columns = [
    { accessorKey: 'batchNumber', header: 'رقم الدفعة', cell: ({ row }: { row: { original: Batch } }) => <span className="font-mono text-xs font-medium">{row.original.batchNumber}</span> },
    { accessorKey: 'product', header: 'المنتج', cell: ({ row }: { row: { original: Batch } }) => row.original.product.name },
    { accessorKey: 'warehouse', header: 'المستودع', cell: ({ row }: { row: { original: Batch } }) => row.original.warehouse.name },
    { accessorKey: 'availableQuantity', header: 'الكمية المتاحة', cell: ({ row }: { row: { original: Batch } }) => <span className="font-mono">{row.original.availableQuantity}</span> },
    { accessorKey: 'status', header: 'الحالة', cell: ({ row }: { row: { original: Batch } }) => <Badge variant={STATUS_VARIANTS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge> },
    { accessorKey: 'expiryDate', header: 'تاريخ الصلاحية', cell: ({ row }: { row: { original: Batch } }) => row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString('ar-EG') : '-' },
    { id: 'actions', header: 'إجراءات', cell: ({ row }: { row: { original: Batch } }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض"><Eye className="size-4" /></Button>
        {canUpdate && <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)} title="تعديل"><Pencil className="size-4" /></Button>}
        {canDelete && <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original._id)} title="حذف"><Trash2 className="size-4 text-destructive" /></Button>}
      </div>
    )},
  ];

  return (
    <AppLayout title="الدفعات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الدفعات</CardTitle>
          {canCreate && <Button onClick={handleOpenCreate}><Plus className="size-4" /> دفعة جديدة</Button>}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل المنتجات</option>
              {activeProducts.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل المستودعات</option>
              {activeWarehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <select value={selectedBStatus} onChange={(e) => setSelectedBStatus(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="depleted">منتهي</option>
              <option value="expired">منتهي الصلاحية</option>
              <option value="quarantined">محجوز</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />)}</div>
          ) : error ? (
            <div className="text-center text-destructive py-8">فشل تحميل البيانات</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="لا توجد دفعات" description="قم بإضافة دفعة جديدة للبدء" />
          ) : (
            <DataTable columns={columns} data={filtered} searchKey="batchNumber" searchPlaceholder="بحث عن رقم الدفعة..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditTarget(null); } }}
        title={editTarget ? 'تعديل الدفعة' : 'دفعة جديدة'}
        description={editTarget ? `تعديل الدفعة: ${editTarget.batchNumber}` : 'إدخال بيانات الدفعة'}
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setOpen(false); setEditTarget(null); }} disabled={isMutating}>إلغاء</Button>
          <Button form="batch-form" type="submit" isLoading={isMutating}>{editTarget ? 'تحديث' : 'حفظ'}</Button>
        </div>}
      >
        <form id="batch-form" onSubmit={handleSubmit((values) => onSubmit(values))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField control={control} name="product" label="المنتج" required placeholder="اختر المنتج"
              options={activeProducts.map((p) => ({ value: p._id, label: p.name }))}
              error={errors.product?.message}
            />
            <SelectField control={control} name="warehouse" label="المستودع" required placeholder="اختر المستودع"
              options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
              error={errors.warehouse?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="رقم الدفعة" required error={errors.batchNumber?.message}>
              <Input {...register('batchNumber')} placeholder="رقم الدفعة" />
            </FormField>
            <FormField label="رقم اللوت" error={errors.lotNumber?.message}>
              <Input {...register('lotNumber')} placeholder="رقم اللوت (اختياري)" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="تاريخ التصنيع">
              <Input type="date" {...register('manufacturingDate')} />
            </FormField>
            <FormField label="تاريخ الصلاحية">
              <Input type="date" {...register('expiryDate')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الكمية الأولية" required error={errors.initialQuantity?.message}>
              <Input type="number" min="0" step="1" {...register('initialQuantity')} placeholder="0" />
            </FormField>
            <FormField label="تكلفة الوحدة" error={errors.unitCost?.message}>
              <Input type="number" min="0" step="0.01" {...register('unitCost')} placeholder="0.00" />
            </FormField>
          </div>
          <SelectField control={control} name="supplier" label="المورد" placeholder="اختر المورد"
            options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
            error={errors.supplier?.message}
          />
          <FormField label="ملاحظات" error={errors.notes?.message}>
            <Input {...register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
          </FormField>
        </form>
      </Dialog>

      <Dialog open={!!viewTarget} onOpenChange={(v) => !v && setViewTarget(null)}
        title="تفاصيل الدفعة" description={viewTarget ? `رقم: ${viewTarget.batchNumber}` : ''}>
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">رقم الدفعة</p><p className="text-sm font-mono font-medium">{viewTarget.batchNumber}</p></div>
              <div><p className="text-xs text-muted-foreground">الحالة</p><Badge variant={STATUS_VARIANTS[viewTarget.status]}>{STATUS_LABELS[viewTarget.status]}</Badge></div>
              <div><p className="text-xs text-muted-foreground">المنتج</p><p className="text-sm">{viewTarget.product.name}</p></div>
              <div><p className="text-xs text-muted-foreground">المستودع</p><p className="text-sm">{viewTarget.warehouse.name}</p></div>
              <div><p className="text-xs text-muted-foreground">الكمية الأولية</p><p className="text-sm font-mono">{viewTarget.initialQuantity}</p></div>
              <div><p className="text-xs text-muted-foreground">الكمية المتاحة</p><p className="text-sm font-mono">{viewTarget.availableQuantity}</p></div>
              <div><p className="text-xs text-muted-foreground">الكمية المحجوزة</p><p className="text-sm font-mono">{viewTarget.reservedQuantity}</p></div>
              <div><p className="text-xs text-muted-foreground">تكلفة الوحدة</p><p className="text-sm font-mono">{viewTarget.unitCost.toFixed(2)} ر.س</p></div>
              {viewTarget.lotNumber && <div><p className="text-xs text-muted-foreground">رقم اللوت</p><p className="text-sm">{viewTarget.lotNumber}</p></div>}
              {viewTarget.manufacturingDate && <div><p className="text-xs text-muted-foreground">تاريخ التصنيع</p><p className="text-sm">{new Date(viewTarget.manufacturingDate).toLocaleDateString('ar-EG')}</p></div>}
              {viewTarget.expiryDate && <div><p className="text-xs text-muted-foreground">تاريخ الصلاحية</p><p className="text-sm">{new Date(viewTarget.expiryDate).toLocaleDateString('ar-EG')}</p></div>}
              {viewTarget.supplier && <div><p className="text-xs text-muted-foreground">المورد</p><p className="text-sm">{viewTarget.supplier.name}</p></div>}
            </div>
            {viewTarget.notes && <div><p className="text-xs text-muted-foreground">ملاحظات</p><p className="text-sm">{viewTarget.notes}</p></div>}
          </div>
        )}
      </Dialog>
    </AppLayout>
  );
}
