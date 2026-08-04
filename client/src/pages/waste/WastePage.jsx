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
  getWasteRecords,
  getWasteById,
  createWaste,
  cancelWaste,
  getWarehouses,
  getAllProducts,
  getBatches } from
'../../lib/api/entities';


const STATUS_LABELS = {
  draft: 'مسودة',
  completed: 'مكتمل',
  cancelled: 'ملغي'
};

const STATUS_VARIANTS = {
  draft: 'secondary',
  completed: 'success',
  cancelled: 'destructive'
};

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  batch: z.string().min(1, 'الدفعة مطلوبة'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0')
});

const wasteSchema = z.object({
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  wasteDate: z.string().optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  reason: z.string().trim().min(1, 'السبب مطلوب').max(500, 'الحد الأقصى 500 حرف'),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  items: z.array(itemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل')
});



const emptyItem = { product: '', batch: '', quantity: 1 };

const emptyForm = {
  warehouse: '',
  wasteDate: '',
  reason: '',
  notes: '',
  items: [{ ...emptyItem }]
};

export function WastePage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canCreate = hasPermission('wastes:create');
  const canDelete = hasPermission('wastes:delete');

  const { data: wastes = [], isLoading, error } = useQuery({
    queryKey: ['wastes'],
    queryFn: () => getWasteRecords()
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
      return createWaste(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wastes'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء سجل الهالك بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء سجل الهالك')
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelWaste(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wastes'] });
      setCancelTarget(null);
      setCancelReason('');
      toast.success('تم إلغاء سجل الهالك بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إلغاء سجل الهالك')
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(wasteSchema),
    defaultValues: emptyForm
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const activeWarehouses = warehouses.filter((w) => w.isActive);

  function handleOpenCreate() {
    reset(emptyForm);
    setOpen(true);
  }

  function handleView(id) {
    getWasteById(id).
    then((w) => setViewTarget(w)).
    catch(() => toast.error('فشل تحميل تفاصيل الهالك'));
  }

  function onSubmit(values) {
    if (!user) return;
    createMutation.mutate(values);
  }

  const filteredWastes = wastes.filter((w) => {
    if (selectedWarehouse && w.warehouse._id !== selectedWarehouse) return false;
    if (selectedStatus && w.status !== selectedStatus) return false;
    return true;
  });

  const columns = [
  { accessorKey: 'wasteNumber', header: 'رقم السجل', cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.wasteNumber}</span> },
  { accessorKey: 'warehouse', header: 'المستودع', cell: ({ row }) => row.original.warehouse.name },
  { accessorKey: 'wasteDate', header: 'التاريخ', cell: ({ row }) => new Date(row.original.wasteDate).toLocaleDateString('ar-EG') },
  { accessorKey: 'status', header: 'الحالة', cell: ({ row }) => <Badge variant={STATUS_VARIANTS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge> },
  { accessorKey: 'reason', header: 'السبب', cell: ({ row }) => <span className="max-w-[200px] truncate">{row.original.reason}</span> },
  { accessorKey: 'items', header: 'البنود', cell: ({ row }) => <span className="font-mono">{row.original.items.length}</span> },
  { accessorKey: 'createdBy', header: 'بواسطة', cell: ({ row }) => row.original.createdBy.displayName },
  { id: 'actions', header: 'إجراءات', cell: ({ row }) =>
    <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض"><Eye className="size-4" /></Button>
        {canDelete && row.original.status === 'completed' &&
      <Button variant="ghost" size="icon" onClick={() => setCancelTarget(row.original)} title="إلغاء" className="text-destructive hover:text-destructive">
            <XCircle className="size-4" />
          </Button>
      }
      </div>
  }];


  return (
    <AppLayout title="الهالك">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة الهالك</CardTitle>
          {canCreate && <Button onClick={handleOpenCreate} className="w-full sm:w-auto justify-center"><Plus className="size-4" /> تسجيل هالك</Button>}
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
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {isLoading ?
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />)}</div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          filteredWastes.length === 0 ?
          <EmptyState title="لا توجد سجلات هالك" description="قم بتسجيل هالك جديد للبدء" /> :

          <DataTable columns={columns} data={filteredWastes} searchKey="wasteNumber" searchPlaceholder="بحث عن رقم السجل..." />
          }
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="تسجيل هالك جديد" description="إدخال بيانات الهالك"
      footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>إلغاء</Button>
          <Button form="waste-form" type="submit" isLoading={createMutation.isPending}>حفظ</Button>
        </div>}>
        
        <form id="waste-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField control={control} name="warehouse" label="المستودع" required placeholder="اختر المستودع"
          options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
          error={errors.warehouse?.message} />
          
          <FormField label="تاريخ الهالك">
            <Input type="date" {...register('wasteDate')} />
          </FormField>
          <FormField label="السبب" required error={errors.reason?.message}>
            <Input {...register('reason')} placeholder="سبب الهالك" />
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
                <FormField label="الكمية" required error={errors.items?.[index]?.quantity?.message}>
                  <Input type="number" min="1" step="1" {...register(`items.${index}.quantity`)} placeholder="1" />
                </FormField>
              </div>
            )}
          </div>

          <FormField label="ملاحظات" error={errors.notes?.message}>
            <Input {...register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
          </FormField>
        </form>
      </Dialog>

      <Dialog open={!!viewTarget} onOpenChange={(v) => !v && setViewTarget(null)}
      title="تفاصيل الهالك" description={viewTarget ? `رقم: ${viewTarget.wasteNumber}` : ''}>
        {viewTarget &&
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">رقم السجل</p><p className="text-sm font-mono font-medium">{viewTarget.wasteNumber}</p></div>
              <div><p className="text-xs text-muted-foreground">الحالة</p><Badge variant={STATUS_VARIANTS[viewTarget.status]}>{STATUS_LABELS[viewTarget.status]}</Badge></div>
              <div><p className="text-xs text-muted-foreground">المستودع</p><p className="text-sm font-medium">{viewTarget.warehouse.name}</p></div>
              <div><p className="text-xs text-muted-foreground">التاريخ</p><p className="text-sm">{new Date(viewTarget.wasteDate).toLocaleDateString('ar-EG')}</p></div>
              <div className="col-span-2"><p className="text-xs text-muted-foreground">السبب</p><p className="text-sm">{viewTarget.reason}</p></div>
              <div><p className="text-xs text-muted-foreground">بواسطة</p><p className="text-sm">{viewTarget.createdBy.displayName}</p></div>
            </div>
            {viewTarget.notes && <div><p className="text-xs text-muted-foreground">ملاحظات</p><p className="text-sm">{viewTarget.notes}</p></div>}
            <div>
              <p className="text-xs text-muted-foreground mb-2">البنود ({viewTarget.items.length})</p>
              <div className="space-y-2">
                {viewTarget.items.map((item, index) =>
              <div key={index} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between"><p className="font-medium">{item.product.name}</p><span className="font-mono text-xs">{item.product.sku}</span></div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>الدفعة: <span className="font-mono">{item.batch.batchNumber}</span></span>
                      <span>الكمية: <span className="font-mono">{item.quantity}</span></span>
                    </div>
                  </div>
              )}
              </div>
            </div>
          </div>
        }
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelTarget}
        onOpenChange={(v) => {if (!v) {setCancelTarget(null);setCancelReason('');}}}
        title="إلغاء سجل الهالك"
        description={cancelTarget ? `هل أنت متأكد من إلغاء سجل الهالك ${cancelTarget.wasteNumber}؟` : ''}
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
            <p className="mt-1 text-xs">سيتم إعادة الكمية إلى المخزون.</p>
          </div>
          {cancelTarget &&
          <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم السجل:</span>
                <span className="font-mono">{cancelTarget.wasteNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المستودع:</span>
                <span>{cancelTarget.warehouse.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">السبب:</span>
                <span>{cancelTarget.reason}</span>
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