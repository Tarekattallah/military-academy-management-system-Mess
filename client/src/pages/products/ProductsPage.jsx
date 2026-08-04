import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { SelectField } from '../../components/ui/SelectField';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppLayout } from '../../components/layout/AppLayout';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '../../lib/csvExport';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getProducts,
  getCategories,
  getUnits,
  getSuppliers,
  createProduct,
  updateProduct,
  deleteProduct } from
'../../lib/api/entities';


const productSchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب').max(200),
  description: z.string().trim().max(1000).optional().default(''),
  category: z.string().min(1, 'التصنيف مطلوب'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  unitPrice: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالباً').default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  supplier: z.string().optional().default(''),
  minStockLevel: z.coerce.number().min(0).default(0),
  maxStockLevel: z.coerce.number().min(0).optional(),
  sku: z.string().trim().max(50).optional().default(''),
  barcode: z.string().trim().max(100).optional().default(''),
  isActive: z.string().default('true')
});



const emptyForm = {
  name: '',
  description: '',
  category: '',
  unit: '',
  unitPrice: 0,
  taxRate: 0,
  supplier: '',
  minStockLevel: 0,
  maxStockLevel: undefined,
  sku: '',
  barcode: '',
  isActive: 'true'
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnits
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      toast.success('تم إنشاء المنتج بنجاح');
    },
    onError: () => toast.error('فشل إنشاء المنتج')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setEditing(null);
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: () => toast.error('فشل تحديث المنتج')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteTarget(null);
      toast.success('تم حذف المنتج بنجاح');
    },
    onError: () => toast.error('فشل حذف المنتج')
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: emptyForm
  });

  function handleOpenCreate() {
    setEditing(null);
    reset(emptyForm);
    setOpen(true);
  }

  function handleOpenEdit(product) {
    setEditing(product);
    reset({
      name: product.name,
      description: product.description || '',
      category: typeof product.category === 'object' ? product.category._id : product.category,
      unit: typeof product.unit === 'object' ? product.unit._id : product.unit,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate,
      supplier: product.supplier ? typeof product.supplier === 'object' ? product.supplier._id : product.supplier : '',
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel,
      sku: product.sku || '',
      barcode: product.barcode || '',
      isActive: String(product.isActive)
    });
    setOpen(true);
  }

  function onSubmit(values) {
    const payload = {
      ...values,
      supplier: values.supplier || null,
      maxStockLevel: values.maxStockLevel || null,
      isActive: values.isActive === 'true'
    };
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const columns = [
  {
    accessorKey: 'name',
    header: 'المنتج',
    cell: ({ row }) =>
    <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          {row.original.sku &&
      <p className="text-xs text-muted-foreground font-mono">SKU: {row.original.sku}</p>
      }
        </div>

  },
  {
    accessorKey: 'category',
    header: 'التصنيف',
    cell: ({ row }) =>
    typeof row.original.category === 'object' ? row.original.category.name : row.original.category
  },
  {
    accessorKey: 'unit',
    header: 'الوحدة',
    cell: ({ row }) =>
    typeof row.original.unit === 'object' ? row.original.unit.name : row.original.unit
  },
  {
    accessorKey: 'unitPrice',
    header: 'السعر',
    cell: ({ row }) => `${row.original.unitPrice.toFixed(2)}`
  },
  {
    accessorKey: 'supplier',
    header: 'المورد',
    cell: ({ row }) =>
    row.original.supplier ? typeof row.original.supplier === 'object' ? row.original.supplier.name : row.original.supplier : '—'
  },
  {
    accessorKey: 'isActive',
    header: 'الحالة',
    cell: ({ row }) =>
    <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
          {row.original.isActive ? 'نشط' : 'غير نشط'}
        </Badge>

  },
  {
    id: 'actions',
    header: 'إجراءات',
    cell: ({ row }) =>
    <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)} title="حذف">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>

  }];


  return (
    <AppLayout title="المنتجات">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة المنتجات</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial justify-center"
              onClick={() =>
              exportToCSV(
                products,
                [
                { header: 'الاسم', accessor: (r) => r.name },
                { header: 'SKU', accessor: (r) => r.sku || '' },
                { header: 'التصنيف', accessor: (r) => typeof r.category === 'object' ? r.category.name : r.category },
                { header: 'الوحدة', accessor: (r) => typeof r.unit === 'object' ? r.unit.name : r.unit },
                { header: 'السعر', accessor: (r) => r.unitPrice },
                { header: 'الحالة', accessor: (r) => r.isActive ? 'نشط' : 'غير نشط' }],

                'products'
              )
              }>
              
              <Download className="size-4" />
              تصدير
            </Button>
            <Button onClick={handleOpenCreate} className="flex-1 sm:flex-initial justify-center">
              <Plus className="size-4" />
              إضافة منتج
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ?
          <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) =>
            <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
            )}
            </div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          products.length === 0 ?
          <EmptyState
            title="لا توجد منتجات"
            description="قم بإضافة منتج جديد للبدء" /> :


          <DataTable columns={columns} data={products} searchKey="name" searchPlaceholder="بحث عن منتج..." />
          }
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل منتج' : 'إضافة منتج'}
        description={editing ? 'تعديل بيانات المنتج' : 'إدخال بيانات المنتج الجديد'}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="product-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }>
        
        <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="الاسم" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="اسم المنتج" />
          </FormField>

          <FormField label="الوصف" error={errors.description?.message}>
            <Input {...register('description')} placeholder="وصف اختياري" />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              control={control}
              name="category"
              label="التصنيف"
              required
              placeholder="اختر التصنيف"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
              error={errors.category?.message} />
            
            <SelectField
              control={control}
              name="unit"
              label="الوحدة"
              required
              placeholder="اختر الوحدة"
              options={units.map((u) => ({ value: u._id, label: u.name }))}
              error={errors.unit?.message} />
            
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="سعر الوحدة" error={errors.unitPrice?.message}>
              <Input type="number" step="0.01" {...register('unitPrice')} />
            </FormField>

            <FormField label="نسبة الضريبة %" error={errors.taxRate?.message}>
              <Input type="number" step="0.01" {...register('taxRate')} />
            </FormField>
          </div>

          <SelectField
            control={control}
            name="supplier"
            label="المورد"
            placeholder="اختر المورد (اختياري)"
            options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
            error={errors.supplier?.message} />
          

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="الحد الأدنى للمخزون" error={errors.minStockLevel?.message}>
              <Input type="number" {...register('minStockLevel')} />
            </FormField>

            <FormField label="الحد الأقصى للمخزون" error={errors.maxStockLevel?.message}>
              <Input type="number" {...register('maxStockLevel')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="SKU" error={errors.sku?.message}>
              <Input {...register('sku')} placeholder="ABCD-001" />
            </FormField>

            <FormField label="الباركود" error={errors.barcode?.message}>
              <Input {...register('barcode')} placeholder="123456789" />
            </FormField>
          </div>

          <SelectField
            control={control}
            name="isActive"
            label="الحالة"
            options={[
            { value: 'true', label: 'نشط' },
            { value: 'false', label: 'غير نشط' }]
            }
            error={errors.isActive?.message} />
          
        </form>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف المنتج"
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              إلغاء
            </Button>
            <Button
            variant="destructive"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
            isLoading={deleteMutation.isPending}>
            
              حذف
            </Button>
          </div>
        } />
      
    </AppLayout>);

}