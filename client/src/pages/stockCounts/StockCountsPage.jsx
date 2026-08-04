import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';
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
  getStockCounts,
  getStockCountById,
  createStockCount,
  approveStockCount,
  cancelStockCount,
  getWarehouses,
  getAllProducts,
  getBatches } from
'../../lib/api/entities';


const STATUS_LABELS = {
  draft: 'مسودة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  approved: 'معتمد',
  cancelled: 'ملغي'
};

const STATUS_VARIANTS = {
  draft: 'secondary',
  in_progress: 'warning',
  completed: 'success',
  approved: 'default',
  cancelled: 'destructive'
};

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  batch: z.string().min(1, 'الدفعة مطلوبة'),
  systemQuantity: z.coerce.number().min(0, 'يجب أن تكون 0 أو أكثر'),
  physicalQuantity: z.coerce.number().min(0, 'يجب أن تكون 0 أو أكثر')
});

const stockCountSchema = z.object({
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  countDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  items: z.array(itemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل')
});



const emptyItem = { product: '', batch: '', systemQuantity: 0, physicalQuantity: 0 };

const emptyForm = {
  warehouse: '',
  countDate: '',
  notes: '',
  items: [{ ...emptyItem }]
};

export function StockCountsPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canCreate = hasPermission('stock-counts:create');
  const canApprove = hasPermission('stock-counts:approve');
  const canDelete = hasPermission('stock-counts:delete');

  const { data: stockCounts = [], isLoading, error } = useQuery({
    queryKey: ['stockCounts'],
    queryFn: () => getStockCounts()
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: getAllProducts,
    enabled: open
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['batches', 'active'],
    queryFn: () => getBatches({ status: 'active' }),
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: (payload) => {
      if (!user) throw new Error('User not authenticated');
      return createStockCount(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء الجرد بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء الجرد')
  });

  const approveMutation = useMutation({
    mutationFn: (id) => {
      if (!user) throw new Error('User not authenticated');
      return approveStockCount(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
      setViewTarget(null);
      toast.success('تم اعتماد الجرد بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل اعتماد الجرد')
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelStockCount(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
      setCancelTarget(null);
      setCancelReason('');
      toast.success('تم إلغاء الجرد بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إلغاء الجرد')
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(stockCountSchema),
    defaultValues: emptyForm
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const activeWarehouses = warehouses.filter((w) => w.isActive);

  function handleOpenCreate() {
    reset(emptyForm);
    setOpen(true);
  }

  function handleView(id) {
    getStockCountById(id).
    then((sc) => setViewTarget(sc)).
    catch(() => toast.error('فشل تحميل تفاصيل الجرد'));
  }

  function handleApprove(id) {
    approveMutation.mutate(id);
  }

  function onSubmit(values) {
    if (!user) return;
    createMutation.mutate(values);
  }

  const filtered = stockCounts.filter((sc) => {
    if (selectedWarehouse && sc.warehouse._id !== selectedWarehouse) return false;
    if (selectedStatus && sc.status !== selectedStatus) return false;
    return true;
  });

  const columns = [
  { accessorKey: 'countNumber', header: 'رقم الجرد', cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.countNumber}</span> },
  { accessorKey: 'warehouse', header: 'المستودع', cell: ({ row }) => row.original.warehouse.name },
  { accessorKey: 'countDate', header: 'التاريخ', cell: ({ row }) => new Date(row.original.countDate).toLocaleDateString('ar-EG') },
  { accessorKey: 'status', header: 'الحالة', cell: ({ row }) => <Badge variant={STATUS_VARIANTS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge> },
  { accessorKey: 'items', header: 'البنود', cell: ({ row }) => <span className="font-mono">{row.original.items.length}</span> },
  { accessorKey: 'createdBy', header: 'بواسطة', cell: ({ row }) => row.original.createdBy.displayName },
  { id: 'actions', header: 'إجراءات', cell: ({ row }) =>
    <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض"><Eye className="size-4" /></Button>
        {canApprove && row.original.status === 'completed' &&
      <Button variant="ghost" size="icon" onClick={() => handleApprove(row.original._id)} title="اعتماد" isLoading={approveMutation.isPending}>
            <CheckCircle className="size-4 text-green-600" />
          </Button>
      }
        {canDelete && (row.original.status === 'completed' || row.original.status === 'approved') &&
      <Button variant="ghost" size="icon" onClick={() => setCancelTarget(row.original)} title="إلغاء" className="text-destructive hover:text-destructive">
            <XCircle className="size-4" />
          </Button>
      }
      </div>
  }];


  return (
    <AppLayout title="جرد المخزون">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة الجرد</CardTitle>
          {canCreate && <Button onClick={handleOpenCreate} className="w-full sm:w-auto justify-center"><Plus className="size-4" /> جرد جديد</Button>}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل المستودعات</option>
              {activeWarehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
              <option value="approved">معتمد</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {isLoading ?
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />)}</div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          filtered.length === 0 ?
          <EmptyState title="لا توجد جرد" description="قم بإضافة جرد جديد للبدء" /> :

          <DataTable columns={columns} data={filtered} searchKey="countNumber" searchPlaceholder="بحث عن رقم الجرد..." />
          }
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="جرد جديد" description="إدخال بيانات الجرد"
      footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>إلغاء</Button>
          <Button form="stock-count-form" type="submit" isLoading={createMutation.isPending}>حفظ</Button>
        </div>}>
        
        <form id="stock-count-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField control={control} name="warehouse" label="المستودع" required placeholder="اختر المستودع"
          options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
          error={errors.warehouse?.message} />
          
          <FormField label="تاريخ الجرد">
            <Input type="date" {...register('countDate')} />
          </FormField>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">البنود</p>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem })}>
                <ArrowLeftRight className="size-4" /> إضافة بند
              </Button>
            </div>
            {errors.items?.root && <p className="text-xs text-destructive">{errors.items.root.message}</p>}
            {fields.map((field, index) =>
            <div key={field.id} className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">بند {index + 1}</p>
                  {fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} title="حذف البند"><Trash2 className="size-4 text-destructive" /></Button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField control={control} name={`items.${index}.product`} label="المنتج" required placeholder="اختر المنتج"
                options={products.filter((p) => p.isActive).map((p) => ({ value: p._id, label: p.name }))}
                error={errors.items?.[index]?.product?.message} />
                
                  <SelectField control={control} name={`items.${index}.batch`} label="الدفعة" required placeholder="اختر الدفعة"
                options={batches.map((b) => ({ value: b._id, label: `${b.batchNumber} (${b.availableQuantity})` }))}
                error={errors.items?.[index]?.batch?.message} />
                
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="الكمية في النظام" required error={errors.items?.[index]?.systemQuantity?.message}>
                    <Input type="number" min="0" step="1" {...register(`items.${index}.systemQuantity`)} placeholder="0" />
                  </FormField>
                  <FormField label="الكمية الفعلية" required error={errors.items?.[index]?.physicalQuantity?.message}>
                    <Input type="number" min="0" step="1" {...register(`items.${index}.physicalQuantity`)} placeholder="0" />
                  </FormField>
                </div>
              </div>
            )}
          </div>

          <FormField label="ملاحظات" error={errors.notes?.message}>
            <Input {...register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
          </FormField>
        </form>
      </Dialog>

      <Dialog open={!!viewTarget} onOpenChange={(v) => !v && setViewTarget(null)}
      title="تفاصيل الجرد" description={viewTarget ? `رقم: ${viewTarget.countNumber}` : ''}>
        {viewTarget &&
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">رقم الجرد</p><p className="text-sm font-mono font-medium">{viewTarget.countNumber}</p></div>
              <div><p className="text-xs text-muted-foreground">الحالة</p><Badge variant={STATUS_VARIANTS[viewTarget.status]}>{STATUS_LABELS[viewTarget.status]}</Badge></div>
              <div><p className="text-xs text-muted-foreground">المستودع</p><p className="text-sm font-medium">{viewTarget.warehouse.name}</p></div>
              <div><p className="text-xs text-muted-foreground">التاريخ</p><p className="text-sm">{new Date(viewTarget.countDate).toLocaleDateString('ar-EG')}</p></div>
              <div><p className="text-xs text-muted-foreground">بواسطة</p><p className="text-sm">{viewTarget.createdBy.displayName}</p></div>
              {viewTarget.approvedBy && <div><p className="text-xs text-muted-foreground">معتمد من</p><p className="text-sm">{viewTarget.approvedBy.displayName}</p></div>}
            </div>
            {viewTarget.notes && <div><p className="text-xs text-muted-foreground">ملاحظات</p><p className="text-sm">{viewTarget.notes}</p></div>}
            <div>
              <p className="text-xs text-muted-foreground mb-2">البنود ({viewTarget.items.length})</p>
              <div className="space-y-2">
                {viewTarget.items.map((item, index) => {
                const diff = item.physicalQuantity - item.systemQuantity;
                return (
                  <div key={index} className="rounded-md border border-border p-2 text-sm">
                      <div className="flex items-center justify-between"><p className="font-medium">{item.product.name}</p><span className="font-mono text-xs">{item.product.sku}</span></div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>الدفعة: <span className="font-mono">{item.batch.batchNumber}</span></span>
                        <span>النظام: <span className="font-mono">{item.systemQuantity}</span></span>
                        <span>فعلي: <span className="font-mono">{item.physicalQuantity}</span></span>
                        <span className={diff !== 0 ? 'text-destructive font-medium' : ''}>
                          الفرق: <span className="font-mono">{diff >= 0 ? `+${diff}` : diff}</span>
                        </span>
                      </div>
                    </div>);

              })}
              </div>
            </div>
          </div>
        }
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(v) => {if (!v) {setCancelTarget(null);setCancelReason('');}}}
        title="إلغاء الجرد"
        description={cancelTarget ? `هل أنت متأكد من إلغاء الجرد ${cancelTarget.countNumber}؟` : ''}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {setCancelTarget(null);setCancelReason('');}} disabled={cancelMutation.isPending}>
              تراجع
            </Button>
            <Button
            variant="destructive"
            onClick={() => {
              if (cancelTarget) {
                cancelMutation.mutate({ id: cancelTarget._id, reason: cancelReason || undefined });
              }
            }}
            isLoading={cancelMutation.isPending}>
            
              تأكيد الإلغاء
            </Button>
          </div>
        }>
        
        <div className="space-y-4">
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-medium">تحذير: هذا الإجراء لا يمكن التراجع عنه</p>
            <p className="mt-1 text-xs">سيتم عكس جميع تعديلات المخزون المرتبطة بهذا الجرد.</p>
          </div>
          {cancelTarget &&
          <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الجرد:</span>
                <span className="font-mono">{cancelTarget.countNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المستودع:</span>
                <span>{cancelTarget.warehouse.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الحالة:</span>
                <span>{STATUS_LABELS[cancelTarget.status]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">البنود:</span>
                <span>{cancelTarget.items.length}</span>
              </div>
            </div>
          }
          <FormField label="سبب الإلغاء (اختياري)">
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ذكر سبب الإلغاء..." />
            
          </FormField>
        </div>
      </Dialog>
    </AppLayout>);

}