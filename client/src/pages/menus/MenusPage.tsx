import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Eye } from 'lucide-react';
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
import {
  getMenus,
  createMenu,
  updateMenu,
  updateMenuStatus,
  getRecipes,
} from '../../lib/api/entities';
import type { Menu, MenuStatus } from '../../types/menus';
import type { Recipe } from '../../types/recipes';

const menuItemSchema = z.object({
  recipe: z.string().min(1, 'الوصفة مطلوبة'),
  plannedServings: z.coerce.number().min(1, 'عدد الحصص يجب أن يكون 1 على الأقل'),
  notes: z.string().trim().optional().default(''),
});

const menuSchema = z.object({
  menuDate: z.string().min(1, 'التاريخ مطلوب'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner'], {
    required_error: 'نوع الوجبة مطلوب',
  }),
  notes: z.string().trim().optional().default(''),
  items: z.array(menuItemSchema).min(1, 'يجب إضافة وصفة واحدة على الأقل لقائمة الطعام'),
});

type MenuFormSchema = z.infer<typeof menuSchema>;

const emptyForm = (): MenuFormSchema => ({
  menuDate: new Date().toISOString().split('T')[0],
  mealType: 'lunch',
  notes: '',
  items: [{ recipe: '', plannedServings: 100, notes: '' }],
});

const mealTypeLabels = {
  breakfast: 'فطور',
  lunch: 'غداء',
  dinner: 'عشاء',
};

const statusLabels = {
  draft: 'مسودة',
  published: 'منشورة',
  closed: 'مغلقة',
};

const statusVariants: Record<MenuStatus, 'secondary' | 'success' | 'destructive'> = {
  draft: 'secondary',
  published: 'success',
  closed: 'destructive',
};

export function MenusPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Menu | null>(null);
  const [editing, setEditing] = useState<Menu | null>(null);

  const canCreate = hasPermission('menus:create');
  const canUpdate = hasPermission('menus:update');

  const { data: menus = [], isLoading, error } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  });

  const { data: recipes = [] } = useQuery<Recipe[]>({
    queryKey: ['recipes'],
    queryFn: getRecipes,
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      setOpen(false);
      toast.success('تم إنشاء قائمة الطعام بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء قائمة الطعام'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMenu(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      setOpen(false);
      setEditing(null);
      toast.success('تم تحديث قائمة الطعام بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل تحديث قائمة الطعام'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MenuStatus }) =>
      updateMenuStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('تم تحديث حالة قائمة الطعام بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل تحديث حالة قائمة الطعام'),
  });

  const form = useForm<MenuFormSchema>({
    resolver: zodResolver(menuSchema) as any,
    defaultValues: emptyForm(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset(emptyForm());
    setOpen(true);
  }

  function handleOpenEdit(menu: Menu) {
    setEditing(menu);
    form.reset({
      menuDate: menu.menuDate.split('T')[0],
      mealType: menu.mealType,
      notes: menu.notes || '',
      items: menu.items.map((item) => ({
        recipe: item.recipe?._id || '',
        plannedServings: item.plannedServings,
        notes: item.notes || '',
      })),
    });
    setOpen(true);
  }

  function onSubmit(values: MenuFormSchema) {
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns = [
    {
      accessorKey: 'menuNumber',
      header: 'رقم القائمة',
      cell: ({ row }: { row: { original: Menu } }) => (
        <span className="font-mono text-xs font-semibold">{row.original.menuNumber}</span>
      ),
    },
    {
      accessorKey: 'menuDate',
      header: 'التاريخ',
      cell: ({ row }: { row: { original: Menu } }) => (
        <span>{new Date(row.original.menuDate).toLocaleDateString('ar-EG')}</span>
      ),
    },
    {
      accessorKey: 'mealType',
      header: 'الوجبة',
      cell: ({ row }: { row: { original: Menu } }) => mealTypeLabels[row.original.mealType] || row.original.mealType,
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }: { row: { original: Menu } }) => (
        <Badge variant={statusVariants[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: Menu } }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewTarget(row.original)} title="عرض التفاصيل">
            <Eye className="size-4 text-muted-foreground" />
          </Button>
          {canUpdate && row.original.status === 'draft' && (
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
              <Pencil className="size-4" />
            </Button>
          )}
          {canUpdate && row.original.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: row.original._id, status: 'published' })}
            >
              نشر
            </Button>
          )}
          {canUpdate && row.original.status === 'published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: row.original._id, status: 'closed' })}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              إغلاق
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="قوائم الطعام اليومية">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>تخطيط القوائم اليومية</CardTitle>
          {canCreate && (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              إضافة قائمة
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div>
          ) : menus.length === 0 ? (
            <EmptyState title="لا توجد قوائم طعام" description="قم بإضافة قائمة طعام جديدة لتخطيط الوجبات وصرف المكونات" />
          ) : (
            <DataTable columns={columns} data={menus} searchKey="menuNumber" searchPlaceholder="بحث برقم القائمة..." />
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title={`تفاصيل قائمة الطعام ${viewTarget?.menuNumber || ''}`}
        description={`تاريخ الوجبة: ${viewTarget ? new Date(viewTarget.menuDate).toLocaleDateString('ar-EG') : ''}`}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              إغلاق
            </Button>
          </div>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b border-border pb-4">
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">نوع الوجبة</span>
                <span className="font-semibold text-foreground">{mealTypeLabels[viewTarget.mealType]}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">الحالة</span>
                <Badge variant={statusVariants[viewTarget.status]}>
                  {statusLabels[viewTarget.status]}
                </Badge>
              </div>
              {viewTarget.notes && (
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground font-medium mb-0.5">ملاحظات</span>
                  <p className="text-foreground bg-secondary/35 p-2 rounded-md">{viewTarget.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">أصناف الطعام والوجبات المخططة</h3>
              <div className="border border-border rounded-md divide-y divide-border">
                {viewTarget.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 text-sm">
                    <div>
                      <p className="font-bold text-foreground">{item.recipe?.name}</p>
                      {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                    </div>
                    <span className="font-semibold text-primary">
                      {item.plannedServings.toLocaleString('ar-EG')} حصة مخطط لها
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل قائمة طعام' : 'إضافة قائمة طعام'}
        description={editing ? 'تعديل أصناف الوجبة والحصص المخططة لها' : 'تخطيط وجبة جديدة وتحديد الأصناف والحصص المستهدفة'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={form.formState.isSubmitting}>
              إلغاء
            </Button>
            <Button form="menu-form" type="submit" isLoading={form.formState.isSubmitting}>
              حفظ
            </Button>
          </div>
        }
      >
        <form id="menu-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="التاريخ" required error={form.formState.errors.menuDate?.message}>
              <Input type="date" {...form.register('menuDate')} />
            </FormField>

            <SelectField
              control={form.control}
              name="mealType"
              label="نوع الوجبة"
              required
              options={[
                { value: 'breakfast', label: 'فطور' },
                { value: 'lunch', label: 'غداء' },
                { value: 'dinner', label: 'عشاء' },
              ]}
              error={form.formState.errors.mealType?.message}
            />
          </div>

          <FormField label="ملاحظات عامة" error={form.formState.errors.notes?.message}>
            <Input {...form.register('notes')} placeholder="مثال: تخطيط وجبة غداء يوم الجمعة" />
          </FormField>

          {/* Menu Items field array */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                أصناف الطعام المدرجة <span className="text-destructive">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ recipe: '', plannedServings: 100, notes: '' })}
              >
                + إضافة صنف
              </Button>
            </div>
            {form.formState.errors.items?.message && (
              <p className="text-xs text-destructive font-medium">{form.formState.errors.items.message}</p>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <SelectField
                      control={form.control}
                      name={`items.${index}.recipe`}
                      placeholder="اختر الوصفة"
                      options={recipes.filter(r => r.status === 'active').map((r) => ({ value: r._id, label: r.name }))}
                      error={form.formState.errors.items?.[index]?.recipe?.message}
                    />
                  </div>
                  <div className="w-28">
                    <FormField error={form.formState.errors.items?.[index]?.plannedServings?.message}>
                      <Input
                        type="number"
                        placeholder="عدد الحصص"
                        {...form.register(`items.${index}.plannedServings`)}
                      />
                    </FormField>
                  </div>
                  <div className="w-32">
                    <FormField error={form.formState.errors.items?.[index]?.notes?.message}>
                      <Input
                        placeholder="ملاحظات الصنف"
                        {...form.register(`items.${index}.notes`)}
                      />
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    className="size-9 text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Dialog>
    </AppLayout>
  );
}
const Trash2 = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
