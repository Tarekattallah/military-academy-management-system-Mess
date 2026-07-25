import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, ArrowLeftRight, CheckCircle } from 'lucide-react';
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
  getWarehouses,
  getAllProducts,
  getBatches,
} from '../../lib/api/entities';
import type { StockCount, StockCountStatus } from '../../types/stockCounts';

const STATUS_LABELS: Record<StockCountStatus, string> = {
  draft: 'مسودة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  approved: 'معتمد',
};

const STATUS_VARIANTS: Record<StockCountStatus, 'secondary' | 'warning' | 'success' | 'default'> = {
  draft: 'secondary',
  in_progress: 'warning',
  completed: 'success',
  approved: 'default',
};

const itemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  batch: z.string().min(1, 'الدفعة مطلوبة'),
  systemQuantity: z.coerce.number().min(0, 'يجب أن تكون 0 أو أكثر'),
  physicalQuantity: z.coerce.number().min(0, 'يجب أن تكون 0 أو أكثر'),
});

const stockCountSchema = z.object({
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  countDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => (v === '' ? undefined : v)),
  items: z.array(itemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
});

type StockCountFormValues = z.infer<typeof stockCountSchema>;

const emptyItem = { product: '', batch: '', systemQuantity: 0, physicalQuantity: 0 };

const emptyForm: StockCountFormValues = {
  warehouse: '',
  countDate: '',
  notes: '',
  items: [{ ...emptyItem }],
};

export function StockCountsPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<StockCount | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const canCreate = hasPermission('stock-counts:create');
  const canApprove = hasPermission('stock-counts:approve');

  const { data: stockCounts = [], isLoading, error } = useQuery({
    queryKey: ['stockCounts'],
    queryFn: () => getStockCounts(),
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
    mutationFn: (payload: StockCountFormValues) => {
      if (!user) throw new Error('User not authenticated');
      return createStockCount(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء الجرد بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء الجرد'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => {
      if (!user) throw new Error('User not authenticated');
      return approveStockCount(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockCounts'] });
      setViewTarget(null);
      toast.success('تم اعتماد الجرد بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل اعتماد الجرد'),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<StockCountFormValues>({
    resolver: zodResolver(stockCountSchema),
    defaultValues: emptyForm,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const activeWarehouses = warehouses.filter((w) => w.isActive);

  function handleOpenCreate() {
    reset(emptyForm);
    setOpen(true);
  }

  function handleView(id: string) {
    getStockCountById(id)
      .then((sc) => setViewTarget(sc))
      .catch(() => toast.error('فشل تحميل تفاصيل الجرد'));
  }

  function handleApprove(id: string) {
    approveMutation.mutate(id);
  }

  function onSubmit(values: StockCountFormValues) {
    if (!user) return;
    createMutation.mutate(values);
  }

  const filtered = stockCounts.filter((sc) => {
    if (selectedWarehouse && sc.warehouse._id !== selectedWarehouse) return false;
    if (selectedStatus && sc.status !== selectedStatus) return false;
    return true;
  });

  const columns = [
    { accessorKey: 'countNumber', header: 'رقم الجرد', cell: ({ row }: { row: { original: StockCount } }) => <span className="font-mono text-xs font-medium">{row.original.countNumber}</span> },
    { accessorKey: 'warehouse', header: 'المستودع', cell: ({ row }: { row: { original: StockCount } }) => row.original.warehouse.name },
    { accessorKey: 'countDate', header: 'التاريخ', cell: ({ row }: { row: { original: StockCount } }) => new Date(row.original.countDate).toLocaleDateString('ar-EG') },
    { accessorKey: 'status', header: 'الحالة', cell: ({ row }: { row: { original: StockCount } }) => <Badge variant={STATUS_VARIANTS[row.original.status]}>{STATUS_LABELS[row.original.status]}</Badge> },
    { accessorKey: 'items', header: 'البنود', cell: ({ row }: { row: { original: StockCount } }) => <span className="font-mono">{row.original.items.length}</span> },
    { accessorKey: 'createdBy', header: 'بواسطة', cell: ({ row }: { row: { original: StockCount } }) => row.original.createdBy.displayName },
    { id: 'actions', header: 'إجراءات', cell: ({ row }: { row: { original: StockCount } }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض"><Eye className="size-4" /></Button>
        {canApprove && row.original.status === 'completed' && (
          <Button variant="ghost" size="icon" onClick={() => handleApprove(row.original._id)} title="اعتماد" isLoading={approveMutation.isPending}>
            <CheckCircle className="size-4 text-green-600" />
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <AppLayout title="جرد المخزون">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الجرد</CardTitle>
          {canCreate && <Button onClick={handleOpenCreate}><Plus className="size-4" /> جرد جديد</Button>}
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل المستودعات</option>
              {activeWarehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="h-9 rounded-md border border-input bg-card px-3 text-sm">
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
              <option value="approved">معتمد</option>
            </select>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />)}</div>
          ) : error ? (
            <div className="text-center text-destructive py-8">فشل تحميل البيانات</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="لا توجد جرد" description="قم بإضافة جرد جديد للبدء" />
          ) : (
            <DataTable columns={columns} data={filtered} searchKey="countNumber" searchPlaceholder="بحث عن رقم الجرد..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen} title="جرد جديد" description="إدخال بيانات الجرد"
        footer={<div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending}>إلغاء</Button>
          <Button form="stock-count-form" type="submit" isLoading={createMutation.isPending}>حفظ</Button>
        </div>}
      >
        <form id="stock-count-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SelectField control={control} name="warehouse" label="المستودع" required placeholder="اختر المستودع"
            options={activeWarehouses.map((w) => ({ value: w._id, label: w.name }))}
            error={errors.warehouse?.message}
          />
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
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="الكمية في النظام" required error={errors.items?.[index]?.systemQuantity?.message}>
                    <Input type="number" min="0" step="1" {...register(`items.${index}.systemQuantity`)} placeholder="0" />
                  </FormField>
                  <FormField label="الكمية الفعلية" required error={errors.items?.[index]?.physicalQuantity?.message}>
                    <Input type="number" min="0" step="1" {...register(`items.${index}.physicalQuantity`)} placeholder="0" />
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

      <Dialog open={!!viewTarget} onOpenChange={(v) => !v && setViewTarget(null)}
        title="تفاصيل الجرد" description={viewTarget ? `رقم: ${viewTarget.countNumber}` : ''}>
        {viewTarget && (
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </AppLayout>
  );
}
