import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { SelectField } from '../../components/ui/SelectField';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { LogoLoader } from '../../components/ui/LogoLoader';
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  updateRecipeStatus,
  getCategories,
  getAllProducts,
  getUnits } from
'../../lib/api/entities';


const recipeItemSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  quantity: z.coerce.number().min(0.001, 'الكمية يجب أن تكون أكبر من صفر'),
  unit: z.string().min(1, 'الوحدة مطلوبة')
});

const recipeSchema = z.object({
  recipeNumber: z.string().trim().min(1, 'رقم الوصفة مطلوب'),
  name: z.string().trim().min(1, 'اسم الوصفة مطلوب').max(100),
  description: z.string().trim().max(500).optional().default(''),
  category: z.string().min(1, 'التصنيف مطلوب'),
  yield: z.coerce.number().min(1, 'عدد الحصص يجب أن يكون 1 على الأقل').default(1),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().trim().max(1000).optional().default(''),
  items: z.array(recipeItemSchema).min(1, 'يجب إضافة مكون واحد على الأقل للوصفة')
});



const emptyForm = () => ({
  recipeNumber: '',
  name: '',
  description: '',
  category: '',
  yield: 1,
  status: 'active',
  notes: '',
  items: [{ product: '', quantity: 1, unit: '' }]
});

export function RecipesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editing, setEditing] = useState(null);

  const canCreate = hasPermission('recipes:create');
  const canUpdate = hasPermission('recipes:update');

  const { data: recipes = [], isLoading, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: getAllProducts,
    enabled: open
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: getUnits,
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setOpen(false);
      toast.success('تم إنشاء الوصفة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء الوصفة')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRecipe(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setOpen(false);
      setEditing(null);
      toast.success('تم تحديث الوصفة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث الوصفة')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
    updateRecipeStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      toast.success('تم تحديث حالة الوصفة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث حالة الوصفة')
  });

  const form = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues: emptyForm()
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset(emptyForm());
    setOpen(true);
  }

  function handleOpenEdit(recipe) {
    setEditing(recipe);
    form.reset({
      recipeNumber: recipe.recipeNumber,
      name: recipe.name,
      description: recipe.description || '',
      category: recipe.category?._id || '',
      yield: recipe.yield,
      status: recipe.status,
      notes: recipe.notes || '',
      items: recipe.items.map((item) => ({
        product: item.product?._id || '',
        quantity: item.quantity,
        unit: item.unit?._id || ''
      }))
    });
    setOpen(true);
  }

  function onSubmit(values) {
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns = [
  {
    accessorKey: 'recipeNumber',
    header: 'رقم الوصفة',
    cell: ({ row }) =>
    <span className="font-mono text-xs font-semibold">{row.original.recipeNumber}</span>

  },
  {
    accessorKey: 'name',
    header: 'اسم الوصفة',
    cell: ({ row }) =>
    <span className="font-medium text-foreground">{row.original.name}</span>

  },
  {
    accessorKey: 'category',
    header: 'التصنيف',
    cell: ({ row }) => row.original.category?.name || '—'
  },
  {
    accessorKey: 'yield',
    header: 'حصص التقديم',
    cell: ({ row }) =>
    <span>{row.original.yield.toLocaleString('ar-EG')} حصة</span>

  },
  {
    accessorKey: 'standardCost',
    header: 'التكلفة المعيارية',
    cell: ({ row }) =>
    <span className="font-semibold text-primary">{(row.original.standardCost || 0).toLocaleString('ar-EG')} جنيه</span>
  },
  {
    id: 'costPerServing',
    header: 'التكلفة للفرد',
    cell: ({ row }) => {
      const costPerServing = (row.original.standardCost || 0) / (row.original.yield || 1);
      return <span className="font-medium text-muted-foreground">{costPerServing.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} جنيه</span>;
    }
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ row }) =>
    <Badge
      variant={row.original.status === 'active' ? 'success' : 'secondary'}
      className="cursor-pointer"
      onClick={() =>
      canUpdate &&
      toggleStatusMutation.mutate({
        id: row.original._id,
        status: row.original.status === 'active' ? 'inactive' : 'active'
      })
      }>
      
          {row.original.status === 'active' ? 'نشط' : 'غير نشط'}
        </Badge>

  },
  {
    id: 'actions',
    header: 'إجراءات',
    cell: ({ row }) =>
    <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewTarget(row.original)} title="عرض التفاصيل">
            <Eye className="size-4 text-muted-foreground" />
          </Button>
          {canUpdate &&
      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
              <Pencil className="size-4" />
            </Button>
      }
        </div>

  }];


  return (
    <AppLayout title="إدارة الوصفات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الوصفات</CardTitle>
          {canCreate &&
          <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              إضافة وصفة
            </Button>
          }
        </CardHeader>
        <CardContent>
          {isLoading ?
          <div className="py-12"><LogoLoader /></div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          recipes.length === 0 ?
          <EmptyState title="لا توجد وصفات" description="قم بإضافة وصفة جديدة لبدء تخطيط الوجبات" /> :

          <DataTable columns={columns} data={recipes} searchKey="name" searchPlaceholder="بحث باسم الوصفة..." />
          }
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title={viewTarget?.name || 'تفاصيل الوصفة'}
        description={`رقم الوصفة: ${viewTarget?.recipeNumber || '—'}`}
        footer={
        <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              إغلاق
            </Button>
          </div>
        }>
        
        {viewTarget &&
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b border-border pb-4">
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">التصنيف</span>
                <span className="font-semibold text-foreground">{viewTarget.category?.name || '—'}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">عدد الحصص (الإنتاجية)</span>
                <span className="font-semibold text-foreground">{viewTarget.yield} حصة</span>
              </div>
              {viewTarget.description &&
            <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground font-medium mb-0.5">الوصف</span>
                  <p className="text-foreground bg-secondary/35 p-2 rounded-md">{viewTarget.description}</p>
                </div>
            }
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">المكونات (المقادير)</h3>
              <div className="border border-border rounded-md divide-y divide-border">
                {viewTarget.items.map((item, idx) =>
              <div key={idx} className="flex justify-between items-center p-2.5 text-sm">
                    <span className="font-medium text-foreground">{item.product?.name}</span>
                    <span className="font-mono font-semibold text-primary">
                      {item.quantity.toLocaleString('ar-EG')} {item.unit?.name}
                    </span>
                  </div>
              )}
              </div>
            </div>

            {viewTarget.notes &&
          <div className="border-t border-border pt-3">
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">ملاحظات</span>
                <p className="text-sm text-muted-foreground italic">{viewTarget.notes}</p>
              </div>
          }
          </div>
        }
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل وصفة' : 'إضافة وصفة'}
        description={editing ? 'تعديل بيانات الوصفة الحالية ومكوناتها' : 'أدخل تفاصيل الوصفة الجديدة والمكونات اللازمة لها'}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={form.formState.isSubmitting}>
              إلغاء
            </Button>
            <Button form="recipe-form" type="submit" isLoading={form.formState.isSubmitting}>
              حفظ
            </Button>
          </div>
        }>
        
        <form id="recipe-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="رقم الوصفة" required error={form.formState.errors.recipeNumber?.message}>
              <Input {...form.register('recipeNumber')} placeholder="مثال: REC-001" />
            </FormField>

            <FormField label="اسم الوصفة" required error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} placeholder="اسم الأكلة/الوصفة" />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="category"
              label="التصنيف"
              required
              placeholder="اختر التصنيف"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
              error={form.formState.errors.category?.message} />
            

            <FormField label="حصص التقديم (الإنتاجية)" required error={form.formState.errors.yield?.message}>
              <Input type="number" {...form.register('yield')} />
            </FormField>
          </div>

          <FormField label="الوصف" error={form.formState.errors.description?.message}>
            <Input {...form.register('description')} placeholder="وصف الوصفة أو طريقة الطبخ باختصار" />
          </FormField>

          {/* Ingredient Items field array */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                المكونات المطلوبة <span className="text-destructive">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product: '', quantity: 1, unit: '' })}>
                
                + إضافة مكون
              </Button>
            </div>
            {form.formState.errors.items?.message &&
            <p className="text-xs text-destructive font-medium">{form.formState.errors.items.message}</p>
            }

            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-2">
              {fields.map((field, index) =>
              <div key={field.id} className="flex gap-2 items-end border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <SelectField
                    control={form.control}
                    name={`items.${index}.product`}
                    placeholder="اختر المنتج"
                    options={products.map((p) => ({ value: p._id, label: p.name }))}
                    error={form.formState.errors.items?.[index]?.product?.message} />
                  
                  </div>
                  <div className="w-24">
                    <FormField error={form.formState.errors.items?.[index]?.quantity?.message}>
                      <Input
                      type="number"
                      step="0.001"
                      placeholder="الكمية"
                      {...form.register(`items.${index}.quantity`)} />
                    
                    </FormField>
                  </div>
                  <div className="w-28">
                    <SelectField
                    control={form.control}
                    name={`items.${index}.unit`}
                    placeholder="الوحدة"
                    options={units.map((u) => ({ value: u._id, label: `${u.name} (${u.abbreviation})` }))}
                    error={form.formState.errors.items?.[index]?.unit?.message} />
                  
                  </div>
                  <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  className="size-9 text-destructive">
                  
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <FormField label="ملاحظات إضافية" error={form.formState.errors.notes?.message}>
            <Input {...form.register('notes')} placeholder="أي تعليمات أو ملاحظات إضافية" />
          </FormField>
        </form>
      </Dialog>
    </AppLayout>);

}