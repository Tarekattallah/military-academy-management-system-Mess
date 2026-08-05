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
import { LogoLoader } from '../../components/ui/LogoLoader';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  cancelTransfer,
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
  sourceBatch: z.string().min(1, 'الدفعة المصدر مطلوبة'),
  destinationBatchNumber: z.string().trim().min(1, 'رقم الدفعة الوجهة مطلوب'),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0')
});

const transferSchema = z.object({
  sourceWarehouse: z.string().min(1, 'المستودع المصدر مطلوب'),
  destinationWarehouse: z.string().min(1, 'المستودع الوجهة مطلوب'),
  transferDate: z.string().optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  items: z.array(itemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل')
});



const emptyItem = {
  product: '',
  sourceBatch: '',
  destinationBatchNumber: '',
  quantity: 1
};

const emptyForm = {
  sourceWarehouse: '',
  destinationWarehouse: '',
  transferDate: '',
  notes: '',
  items: [{ ...emptyItem }]
};

export function TransfersPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDest, setSelectedDest] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canCreate = hasPermission('transfers:create');
  const canDelete = hasPermission('transfers:delete');

  const { data: transfers = [], isLoading, error } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => getTransfers()
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
      return createTransfer(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء التحويل بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء التحويل')
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelTransfer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setCancelTarget(null);
      setCancelReason('');
      toast.success('تم إلغاء التحويل بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إلغاء التحويل')
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: emptyForm
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
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

  function handleView(id) {
    getTransferById(id).
    then((t) => setViewTarget(t)).
    catch(() => toast.error('فشل تحميل تفاصيل التحويل'));
  }

  async function onSubmit(values) {
    if (!user) return;
    try {
      await createMutation.mutateAsync(values);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredTransfers = transfers.filter((t) => {
    if (selectedSource && t.sourceWarehouse?._id !== selectedSource) return false;
    if (selectedDest && t.destinationWarehouse?._id !== selectedDest) return false;
    if (selectedStatus && t.status !== selectedStatus) return false;
    return true;
  });

  const columns = [
  {
    accessorKey: 'transferNumber',
    header: 'رقم التحويل',
    cell: ({ row }) =>
    <span className="font-mono text-xs font-medium">{row.original.transferNumber}</span>

  },
  {
    accessorKey: 'sourceWarehouse',
    header: 'من مستودع',
    cell: ({ row }) => row.original.sourceWarehouse?.name ?? '—'
  },
  {
    accessorKey: 'destinationWarehouse',
    header: 'إلى مستودع',
    cell: ({ row }) => row.original.destinationWarehouse?.name ?? '—'
  },
  {
    accessorKey: 'transferDate',
    header: 'التاريخ',
    cell: ({ row }) =>
    new Date(row.original.transferDate).toLocaleDateString('ar-EG')
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ row }) =>
    <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {STATUS_LABELS[row.original.status]}
        </Badge>

  },
  {
    accessorKey: 'items',
    header: 'البنود',
    cell: ({ row }) =>
    <span className="font-mono">{row.original.items.length}</span>

  },
  {
    accessorKey: 'createdBy',
    header: 'بواسطة',
    cell: ({ row }) => row.original.createdBy?.displayName ?? '—'
  },
  {
    id: 'actions',
    header: 'إجراءات',
    cell: ({ row }) =>
    <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض">
            <Eye className="size-4" />
          </Button>
          {canDelete && row.original.status === 'completed' &&
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCancelTarget(row.original)}
        title="إلغاء"
        className="text-destructive hover:text-destructive">
        
              <XCircle className="size-4" />
            </Button>
      }
        </div>

  }];


  return (
    <AppLayout title="التحويلات">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>قائمة التحويلات</CardTitle>
          {canCreate &&
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto justify-center">
              <Plus className="size-4" />
              تحويل جديد
            </Button>
          }
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              
              <option value="">كل المستودعات المصدر</option>
              {activeWarehouses.map((w) =>
              <option key={w._id} value={w._id}>{w.name}</option>
              )}
            </select>
            <select
              value={selectedDest}
              onChange={(e) => setSelectedDest(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              
              <option value="">كل المستودعات الوجهة</option>
              {activeWarehouses.map((w) =>
              <option key={w._id} value={w._id}>{w.name}</option>
              )}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {isLoading ?
          <div className="py-12"><LogoLoader /></div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          filteredTransfers.length === 0 ?
          <EmptyState
            title="لا توجد تحويلات"
            description="قم بإضافة تحويل جديد للبدء" /> :


          <DataTable columns={columns} data={filteredTransfers} searchKey="transferNumber" searchPlaceholder="بحث عن رقم التحويل..." />
          }
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
        }>
        
        <form id="transfer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              control={control}
              name="sourceWarehouse"
              label="المستودع المصدر"
              required
              placeholder="اختر المستودع المصدر"
              options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
              error={errors.sourceWarehouse?.message} />
            
            <SelectField
              control={control}
              name="destinationWarehouse"
              label="المستودع الوجهة"
              required
              placeholder="اختر المستودع الوجهة"
              options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
              error={errors.destinationWarehouse?.message} />
            
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
                onClick={() => append({ ...emptyItem })}>
                
                <ArrowLeftRight className="size-4" />
                إضافة بند
              </Button>
            </div>
            {errors.items?.root &&
            <p className="text-xs text-destructive">{errors.items.root.message}</p>
            }
            {fields.map((field, index) =>
            <div key={field.id} className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">بند {index + 1}</p>
                  {fields.length > 1 &&
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  title="حذف البند">
                  
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                }
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SelectField
                  control={control}
                  name={`items.${index}.product`}
                  label="المنتج"
                  required
                  placeholder="اختر المنتج"
                  options={products.filter((p) => p.isActive).map((p) => ({ value: p._id, label: p.name }))}
                  error={errors.items?.[index]?.product?.message} />
                
                  <SelectField
                  control={control}
                  name={`items.${index}.sourceBatch`}
                  label="الدفعة المصدر"
                  required
                  placeholder="اختر الدفعة"
                  options={filteredBatches.map((b) => ({ value: b._id, label: `${b.batchNumber} (${b.availableQuantity})` }))}
                  error={errors.items?.[index]?.sourceBatch?.message} />
                
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="رقم الدفعة الوجهة" required error={errors.items?.[index]?.destinationBatchNumber?.message}>
                    <Input {...register(`items.${index}.destinationBatchNumber`)} placeholder="رقم الدفعة في الوجهة" />
                  </FormField>
                  <FormField label="الكمية" required error={errors.items?.[index]?.quantity?.message}>
                    <Input type="number" min="1" step="1" {...register(`items.${index}.quantity`)} placeholder="1" />
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

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title="تفاصيل التحويل"
        description={viewTarget ? `رقم: ${viewTarget.transferNumber}` : ''}>
        
        {viewTarget &&
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
                <p className="text-sm font-medium">{viewTarget.sourceWarehouse?.name ?? '—'} ({viewTarget.sourceWarehouse?.code ?? ''})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إلى مستودع</p>
                <p className="text-sm font-medium">{viewTarget.destinationWarehouse?.name ?? '—'} ({viewTarget.destinationWarehouse?.code ?? ''})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="text-sm">{new Date(viewTarget.transferDate).toLocaleDateString('ar-EG')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">بواسطة</p>
                <p className="text-sm">{viewTarget.createdBy?.displayName ?? '—'}</p>
              </div>
            </div>

            {viewTarget.notes &&
          <div>
                <p className="text-xs text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{viewTarget.notes}</p>
              </div>
          }

            <div>
              <p className="text-xs text-muted-foreground mb-2">البنود ({viewTarget.items.length})</p>
              <div className="space-y-2">
                {viewTarget.items.map((item, index) =>
              <div key={index} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.product?.name ?? '—'}</p>
                      <span className="font-mono text-xs">{item.product?.sku ?? ''}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>الدفعة المصدر: <span className="font-mono">{item.sourceBatch?.batchNumber ?? '—'}</span></span>
                      <span>دفعة الوجهة: <span className="font-mono">{item.destinationBatchNumber}</span></span>
                      <span>الكمية: <span className="font-mono">{item.quantity}</span></span>
                      <span>التكلفة: <span className="font-mono">{(item.unitCost ?? 0).toFixed(2)} ر.س</span></span>
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
        title="إلغاء التحويل"
        description={cancelTarget ? `هل أنت متأكد من إلغاء التحويل ${cancelTarget.transferNumber}؟` : ''}
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
            <p className="mt-1 text-xs">سيتم عكس جميع حركات المخزون المرتبطة بهذا التحويل.</p>
          </div>
          {cancelTarget &&
          <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم التحويل:</span>
                <span className="font-mono">{cancelTarget.transferNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">من:</span>
                <span>{cancelTarget.sourceWarehouse?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">إلى:</span>
                <span>{cancelTarget.destinationWarehouse?.name ?? '—'}</span>
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