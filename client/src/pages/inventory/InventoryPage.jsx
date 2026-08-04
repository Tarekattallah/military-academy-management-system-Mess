import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card } from '../../components/ui/Card';
import { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { SelectField } from '../../components/ui/SelectField';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  getInventoryTransactions,
  getInventoryTransactionById,
  createInventoryTransaction,
  getAllProducts,
  getWarehouses,
  getBatches } from
'../../lib/api/entities';


const TRANSACTION_TYPE_LABELS = {
  receiving: 'استلام',
  transfer_out: 'تحويل خارج',
  transfer_in: 'تحويل داخل',
  return: 'مرتجع',
  return_to_supplier: 'مرتجع للمورد',
  waste: 'هالك',
  adjustment: 'تسوية',
  issue: 'صرف',
  reservation: 'حجز',
  reservation_cancel: 'إلغاء حجز'
};

const TRANSACTION_TYPE_OPTIONS = Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label
}));

const MODULE_LABELS = {
  receiving: 'استلام',
  transfers: 'تحويلات',
  returns: 'مرتجعات',
  waste: 'هالك',
  'stock-count': 'جرد',
  'meal-issue': 'صرف وجبات',
  manual: 'يدوي'
};

const transactionTypes = [
'receiving',
'transfer_out',
'transfer_in',
'return',
'waste',
'adjustment',
'issue',
'reservation',
'reservation_cancel'];


const inventorySchema = z.object({
  batch: z.string().min(1, 'الدفعة مطلوبة'),
  product: z.string().min(1, 'المنتج مطلوب'),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  transactionType: z.enum(transactionTypes, { required_error: 'نوع الحركة مطلوب' }),
  quantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من 0'),
  unitCost: z.coerce.number().min(0).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  reason: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  notes: z.string().trim().max(500).optional().or(z.literal('')).transform((v) => v === '' ? undefined : v)
});



const emptyForm = {
  batch: '',
  product: '',
  warehouse: '',
  transactionType: 'adjustment',
  quantity: 1,
  unitCost: undefined,
  reason: '',
  notes: ''
};

export function InventoryPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const canCreate = hasPermission('inventory-transactions:create');

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: () => getInventoryTransactions()
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: getAllProducts
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatches({ status: 'active' })
  });

  const createMutation = useMutation({
    mutationFn: (payload) => {
      if (!user) throw new Error('User not authenticated');
      return createInventoryTransaction({ ...payload, performedBy: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      setOpen(false);
      reset(emptyForm);
      toast.success('تم إنشاء الحركة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء الحركة')
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(inventorySchema),
    defaultValues: emptyForm
  });

  const watchProduct = watch('product');
  const watchWarehouse = watch('warehouse');

  const filteredBatches = batches.filter((b) => {
    if (watchProduct && b.product._id !== watchProduct) return false;
    if (watchWarehouse && b.warehouse._id !== watchWarehouse) return false;
    return true;
  });

  function handleOpenCreate() {
    reset(emptyForm);
    setOpen(true);
  }

  function handleView(id) {
    getInventoryTransactionById(id).then((t) => setViewTarget(t)).catch(() => toast.error('فشل تحميل تفاصيل الحركة'));
  }

  function onSubmit(values) {
    if (!user) return;
    const payload = {
      batch: values.batch,
      product: values.product,
      warehouse: values.warehouse,
      transactionType: values.transactionType,
      quantity: values.quantity,
      unitCost: values.unitCost,
      reason: values.reason,
      notes: values.notes
    };
    createMutation.mutate(payload);
  }

  const columns = [
  {
    accessorKey: 'transactionDate',
    header: 'التاريخ',
    cell: ({ row }) =>
    new Date(row.original.transactionDate).toLocaleDateString('ar-EG')
  },
  {
    accessorKey: 'transactionType',
    header: 'النوع',
    cell: ({ row }) => {
      const type = row.original.transactionType;
      const variant = type === 'receiving' || type === 'transfer_in' || type === 'return' || type === 'adjustment' ?
      'success' :
      type === 'reservation' || type === 'reservation_cancel' ?
      'warning' :
      'destructive';
      return (
        <Badge variant={variant}>{TRANSACTION_TYPE_LABELS[type] || type}</Badge>);

    }
  },
  {
    accessorKey: 'product',
    header: 'المنتج',
    cell: ({ row }) =>
    <div>
          <p className="font-medium text-foreground">{row.original.product.name}</p>
          <p className="text-xs text-muted-foreground font-mono">SKU: {row.original.product.sku}</p>
        </div>

  },
  {
    accessorKey: 'batch',
    header: 'الدفعة',
    cell: ({ row }) =>
    <span className="font-mono text-xs">{row.original.batch.batchNumber}</span>

  },
  {
    accessorKey: 'warehouse',
    header: 'المستودع',
    cell: ({ row }) => row.original.warehouse.name
  },
  {
    accessorKey: 'quantity',
    header: 'الكمية',
    cell: ({ row }) =>
    <span className="font-mono">{row.original.quantity}</span>

  },
  {
    accessorKey: 'unitCost',
    header: 'التكلفة',
    cell: ({ row }) =>
    `${row.original.totalCost.toFixed(2)} ر.س`
  },
  {
    accessorKey: 'performedBy',
    header: 'بواسطة',
    cell: ({ row }) => row.original.performedBy.displayName
  },
  {
    id: 'actions',
    header: 'إجراءات',
    cell: ({ row }) =>
    <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleView(row.original._id)} title="عرض">
            <Eye className="size-4" />
          </Button>
        </div>

  }];


  const filteredTransactions = transactions.filter((t) => {
    if (selectedProduct && t.product._id !== selectedProduct) return false;
    if (selectedWarehouse && t.warehouse._id !== selectedWarehouse) return false;
    if (selectedType && t.transactionType !== selectedType) return false;
    return true;
  });

  return (
    <AppLayout title="المخزون">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>حركات المخزون</CardTitle>
          {canCreate &&
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto justify-center">
              <Plus className="size-4" />
              إضافة حركة
            </Button>
          }
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              
              <option value="">كل المنتجات</option>
              {products.map((p) =>
              <option key={p._id} value={p._id}>{p.name}</option>
              )}
            </select>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              
              <option value="">كل المستودعات</option>
              {warehouses.map((w) =>
              <option key={w._id} value={w._id}>{w.name}</option>
              )}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm">
              
              <option value="">كل الأنواع</option>
              {TRANSACTION_TYPE_OPTIONS.map((opt) =>
              <option key={opt.value} value={opt.value}>{opt.label}</option>
              )}
            </select>
          </div>

          {isLoading ?
          <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) =>
            <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
            )}
            </div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          filteredTransactions.length === 0 ?
          <EmptyState
            title="لا توجد حركات مخزون"
            description="قم بإضافة حركة جديدة للبدء" /> :


          <DataTable columns={columns} data={filteredTransactions} searchKey="product" searchPlaceholder="بحث عن منتج..." />
          }
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="إضافة حركة مخزون"
        description="إدخال بيانات حركة المخزون الجديدة"
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="inventory-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }>
        
        <form id="inventory-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              control={control}
              name="product"
              label="المنتج"
              required
              placeholder="اختر المنتج"
              options={products.map((p) => ({ value: p._id, label: p.name }))}
              error={errors.product?.message} />
            
            <SelectField
              control={control}
              name="warehouse"
              label="المستودع"
              required
              placeholder="اختر المستودع"
              options={warehouses.map((w) => ({ value: w._id, label: w.name }))}
              error={errors.warehouse?.message} />
            
          </div>

          <SelectField
            control={control}
            name="batch"
            label="الدفعة"
            required
            placeholder="اختر الدفعة"
            options={filteredBatches.map((b) => ({
              value: b._id,
              label: `${b.batchNumber} (${b.availableQuantity} متاح)`
            }))}
            error={errors.batch?.message} />
          

          <SelectField
            control={control}
            name="transactionType"
            label="نوع الحركة"
            required
            placeholder="اختر نوع الحركة"
            options={TRANSACTION_TYPE_OPTIONS}
            error={errors.transactionType?.message} />
          

          <div className="grid grid-cols-2 gap-4">
            <FormField label="الكمية" required error={errors.quantity?.message}>
              <Input type="number" min="1" step="1" {...register('quantity')} placeholder="1" />
            </FormField>
            <FormField label="تكلفة الوحدة" error={errors.unitCost?.message}>
              <Input type="number" min="0" step="0.01" {...register('unitCost')} placeholder="اختياري" />
            </FormField>
          </div>

          <FormField label="السبب" error={errors.reason?.message}>
            <Input {...register('reason')} placeholder="سبب الحركة (اختياري)" />
          </FormField>

          <FormField label="ملاحظات" error={errors.notes?.message}>
            <Input {...register('notes')} placeholder="ملاحظات إضافية (اختياري)" />
          </FormField>
        </form>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title="تفاصيل الحركة"
        description="عرض تفاصيل حركة المخزون">
        
        {viewTarget &&
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">النوع</p>
                <Badge variant="secondary">{TRANSACTION_TYPE_LABELS[viewTarget.transactionType]}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الوحدة النمطية</p>
                <p className="text-sm font-medium">{MODULE_LABELS[viewTarget.module]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المنتج</p>
                <p className="text-sm font-medium">{viewTarget.product.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الدفعة</p>
                <p className="text-sm font-mono">{viewTarget.batch.batchNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المستودع</p>
                <p className="text-sm font-medium">{viewTarget.warehouse.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الكمية</p>
                <p className="text-sm font-mono">{viewTarget.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تكلفة الوحدة</p>
                <p className="text-sm font-mono">{viewTarget.unitCost.toFixed(2)} ر.س</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">التكلفة الإجمالية</p>
                <p className="text-sm font-mono">{viewTarget.totalCost.toFixed(2)} ر.س</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">بواسطة</p>
                <p className="text-sm font-medium">{viewTarget.performedBy.displayName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">التاريخ</p>
                <p className="text-sm font-medium">{new Date(viewTarget.transactionDate).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            {viewTarget.reason &&
          <div>
                <p className="text-xs text-muted-foreground">السبب</p>
                <p className="text-sm">{viewTarget.reason}</p>
              </div>
          }
            {viewTarget.notes &&
          <div>
                <p className="text-xs text-muted-foreground">ملاحظات</p>
                <p className="text-sm">{viewTarget.notes}</p>
              </div>
          }
          </div>
        }
      </Dialog>
    </AppLayout>);

}