import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Pencil, Download } from 'lucide-react';
import { exportToCSV } from '../../lib/csvExport';
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
import { LogoLoader } from '../../components/ui/LogoLoader';
import {
  getBatches,
  getWarehouses,
  getAllProducts,
  getSuppliers,
  createBatch,
  updateBatch,
  deleteBatch } from
'../../lib/api/entities';


const STATUS_LABELS = {
  active: 'نشط',
  depleted: 'منتهي',
  expired: 'منتهي الصلاحية',
  quarantined: 'محجوز',
  archived: 'مؤرشف'
};

const STATUS_VARIANTS = {
  active: 'success',
  depleted: 'secondary',
  expired: 'destructive',
  quarantined: 'warning',
  archived: 'default'
};

const batchSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  batchNumber: z.string().trim().min(1, 'رقم الدفعة مطلوب').max(100),
  lotNumber: z.string().trim().max(100).optional().or(z.literal('')),
  manufacturingDate: z.string().optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  initialQuantity: z.coerce.number().min(0, 'يجب أن تكون 0 أو أكثر'),
  unitCost: z.coerce.number().min(0).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  supplier: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v)
});



const emptyForm = {
  product: '',
  warehouse: '',
  batchNumber: '',
  lotNumber: '',
  manufacturingDate: '',
  expiryDate: '',
  initialQuantity: 0,
  unitCost: undefined,
  supplier: '',
  notes: ''
};

export function BatchesPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('active');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedBStatus, setSelectedBStatus] = useState('');

  const canCreate = hasPermission('batches:create');
  const canUpdate = hasPermission('batches:update');
  const canDelete = hasPermission('batches:delete');

  const { data: batches = [], isLoading, error } = useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatches()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: getAllProducts,
    enabled: open || !!editTarget
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
    enabled: open || !!editTarget
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
    enabled: open || !!editTarget
  });

  const createMutation = useMutation({
    mutationFn: (payload) => {
      if (!user) throw new Error('User not authenticated');
      return createBatch(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء الدفعة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء الدفعة')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      if (!user) throw new Error('User not authenticated');
      return updateBatch(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setEditTarget(null);
      reset(emptyForm);
      toast.success('تم تحديث الدفعة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث الدفعة')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setDeleteTarget(null);
      toast.success('تم حذف الدفعة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل حذف الدفعة')
  });

  const statusUpdateMutation = useMutation({
    mutationFn: ({ id, status }) => {
      if (!user) throw new Error('User not authenticated');
      return updateBatch(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      setStatusUpdateTarget(null);
      toast.success('تم تحديث حالة الدفعة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث حالة الدفعة')
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: emptyForm
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleOpenCreate() {
    reset(emptyForm);
    setEditTarget(null);
    setOpen(true);
  }

  function handleEdit(batch) {
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
      notes: batch.notes || ''
    });
    setEditTarget(batch);
    setOpen(true);
  }

  function handleView(id) {
    const batch = batches.find((b) => b._id === id);
    if (batch) setViewTarget(batch);
  }

  function handleDelete(id) {
    setDeleteTarget(id);
  }

  function handleOpenStatusUpdate(batch) {
    setNewStatus(batch.status);
    setStatusUpdateTarget(batch);
  }

  function handleConfirmStatusUpdate() {
    if (!statusUpdateTarget) return;
    statusUpdateMutation.mutate({ id: statusUpdateTarget._id, status: newStatus });
  }

  function onSubmit(values) {
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
  { accessorKey: 'batchNumber', header: 'رقم الدفعة', cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.batchNumber}</span> },
  { accessorKey: 'product', header: 'المنتج', cell: ({ row }) => row.original.product.name },
  { accessorKey: 'warehouse', header: 'المستودع', cell: ({ row }) => row.original.warehouse.name },
  { accessorKey: 'availableQuantity', header: 'الكمية المتاحة', cell: ({ row }) => <span className="font-mono">{row.original.availableQuantity}</span> },
  { accessorKey: 'status', header: 'الحالة', cell: ({ row }) => <Badge variant={STATUS_VARIANTS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge> },
  { accessorKey: 'expiryDate', header: 'تاريخ الصلاحية', cell: ({ row }) => row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString('ar-EG') : '-' },
  { id: 'actions', header: 'إجراءات', cell: ({ row }) =>
    <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض"><Eye className="size-4" /></Button>
        {canUpdate && <Button variant="ghost" size="icon" onClick={() => handleEdit(row.original)} title="تعديل"><Pencil className="size-4" /></Button>}
        {canUpdate &&
      <Button variant="ghost" size="icon" onClick={() => handleOpenStatusUpdate(row.original)} title="تحديث الحالة">
            <svg className="size-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9" /><path d="M21 3v6h-6" /></svg>
          </Button>
      }
        {canDelete && <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original._id)} title="حذف"><Trash2 className="size-4 text-destructive" /></Button>}
      </div>
  }];


  return (
    <AppLayout title="الدفعات">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة الدفعات</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial justify-center"
              onClick={() =>
              exportToCSV(
                filtered,
                [
                { header: 'رقم الدفعة', accessor: (r) => r.batchNumber },
                { header: 'المنتج', accessor: (r) => r.product.name },
                { header: 'المستودع', accessor: (r) => r.warehouse.name },
                { header: 'الكمية المتاحة', accessor: (r) => r.availableQuantity },
                { header: 'الكمية المحجوزة', accessor: (r) => r.reservedQuantity },
                { header: 'تكلفة الوحدة', accessor: (r) => r.unitCost },
                { header: 'الحالة', accessor: (r) => r.status },
                { header: 'تاريخ الصلاحية', accessor: (r) => r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('ar-EG') : '' }],

                'batches'
              )
              }>
              
              <Download className="size-4" />
              تصدير
            </Button>
            {canCreate && <Button onClick={handleOpenCreate} className="flex-1 sm:flex-initial justify-center"><Plus className="size-4" /> دفعة جديدة</Button>}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل المنتجات</option>
              {activeProducts.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل المستودعات</option>
              {activeWarehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <select value={selectedBStatus} onChange={(e) => setSelectedBStatus(e.target.value)} className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="depleted">منتهي</option>
              <option value="expired">منتهي الصلاحية</option>
              <option value="quarantined">محجوز</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          {isLoading ?
          <div className="py-12"><LogoLoader /></div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          filtered.length === 0 ?
          <EmptyState title="لا توجد دفعات" description="قم بإضافة دفعة جديدة للبدء" /> :

          <DataTable columns={columns} data={filtered} searchKey="batchNumber" searchPlaceholder="بحث عن رقم الدفعة..." />
          }
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => {setOpen(v);if (!v) {setEditTarget(null);}}}
      title={editTarget ? 'تعديل الدفعة' : 'دفعة جديدة'}
      description={editTarget ? `تعديل الدفعة: ${editTarget.batchNumber}` : 'إدخال بيانات الدفعة'}
      footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {setOpen(false);setEditTarget(null);}} disabled={isMutating}>إلغاء</Button>
          <Button form="batch-form" type="submit" isLoading={isMutating}>{editTarget ? 'تحديث' : 'حفظ'}</Button>
        </div>}>
        
        <form id="batch-form" onSubmit={handleSubmit((values) => onSubmit(values))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField control={control} name="product" label="المنتج" required placeholder="اختر المنتج"
            options={activeProducts.map((p) => ({ value: p._id, label: p.name }))}
            error={errors.product?.message} />
            
            <SelectField control={control} name="warehouse" label="المستودع" required placeholder="اختر المستودع"
            options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
            error={errors.warehouse?.message} />
            
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
          error={errors.supplier?.message} />
          
          <FormField label="ملاحظات" error={errors.notes?.message}>
            <Input {...register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
          </FormField>
        </form>
      </Dialog>

      <Dialog open={!!viewTarget} onOpenChange={(v) => !v && setViewTarget(null)}
      title="تفاصيل الدفعة" description={viewTarget ? `رقم: ${viewTarget.batchNumber}` : ''}>
        {viewTarget &&
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
        }
      </Dialog>

      <Dialog
        open={!!statusUpdateTarget}
        onOpenChange={(v) => !v && setStatusUpdateTarget(null)}
        title="تحديث حالة الدفعة"
        description={statusUpdateTarget ? `تغيير حالة الدفعة: ${statusUpdateTarget.batchNumber}` : ''}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStatusUpdateTarget(null)} disabled={statusUpdateMutation.isPending}>
              إلغاء
            </Button>
            <Button
            onClick={handleConfirmStatusUpdate}
            isLoading={statusUpdateMutation.isPending}>
            
              تأكيد تحديث الحالة
            </Button>
          </div>
        }>
        
        {statusUpdateTarget &&
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">رقم الدفعة</p>
                <p className="font-mono font-medium">{statusUpdateTarget.batchNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المنتج</p>
                <p className="font-medium">{statusUpdateTarget.product.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المستودع</p>
                <p className="font-medium">{statusUpdateTarget.warehouse.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الكمية المتاحة</p>
                <p className="font-mono font-medium">{statusUpdateTarget.availableQuantity}</p>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">الحالة الجديدة</label>
              <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
              
                <option value="active">نشط</option>
                <option value="depleted">منتهي (مستنفد)</option>
                <option value="expired">منتهي الصلاحية</option>
                <option value="quarantined">محجوز (حجر صحي)</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>

            {statusUpdateTarget.status === newStatus &&
          <p className="text-xs text-amber-500 font-medium">الحالة الحالية والجديدة متطابقتان. اختر حالة مختلفة لتحديث الدفعة.</p>
          }

            <div className="rounded-md bg-secondary/30 p-3 text-xs text-muted-foreground">
              <p className="font-semibold mb-1">ملاحظة هامة:</p>
              <p>تحديث حالة الدفعة لا يؤثر على كميات المخزون الفعلية. إذا كنت تريد تصحيح كميات المخزون، يرجى استخدام عمليات الجرد أو حركات المخزون المناسبة.</p>
            </div>
          </div>
        }
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف الدفعة"
        description="هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء."
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              إلغاء
            </Button>
            <Button
            variant="destructive"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            isLoading={deleteMutation.isPending}>
            
              حذف
            </Button>
          </div>
        } />
      
    </AppLayout>);

}