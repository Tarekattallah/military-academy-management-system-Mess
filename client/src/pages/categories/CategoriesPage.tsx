import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppLayout } from '../../components/layout/AppLayout';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../lib/api/entities';
import type { Category } from '../../types/products';
import { Label } from '../../components/ui/Input';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب').max(100),
  description: z.string().trim().max(500).optional().default(''),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const emptyForm: CategoryFormValues = {
  name: '',
  description: '',
  isActive: true,
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
      toast.success('تم إنشاء التصنيف بنجاح');
    },
    onError: () => toast.error('فشل إنشاء التصنيف'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
      setEditing(null);
      toast.success('تم تحديث التصنيف بنجاح');
    },
    onError: () => toast.error('فشل تحديث التصنيف'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
      toast.success('تم حذف التصنيف بنجاح');
    },
    onError: () => toast.error('فشل حذف التصنيف'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: emptyForm,
  });

  function handleOpenCreate() {
    setEditing(null);
    reset(emptyForm);
    setOpen(true);
  }

  function handleOpenEdit(category: Category) {
    setEditing(category);
    reset({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setOpen(true);
  }

  function onSubmit(values: CategoryFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'التصنيف',
      cell: ({ row }: { row: { original: Category } }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'الوصف',
      cell: ({ row }: { row: { original: Category } }) => row.original.description || '—',
    },
    {
      accessorKey: 'isActive',
      header: 'الحالة',
      cell: ({ row }: { row: { original: Category } }) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
          {row.original.isActive ? 'نشط' : 'غير نشط'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: Category } }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)} title="حذف">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="التصنيفات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة التصنيفات</CardTitle>
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" />
            إضافة تصنيف
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8">فشل تحميل البيانات</div>
          ) : categories.length === 0 ? (
            <EmptyState
              title="لا توجد تصنيفات"
              description="قم بإضافة تصنيف جديد للبدء"
            />
          ) : (
            <DataTable columns={columns} data={categories} searchKey="name" searchPlaceholder="بحث عن تصنيف..." />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل تصنيف' : 'إضافة تصنيف'}
        description={editing ? 'تعديل بيانات التصنيف' : 'إدخال بيانات التصنيف الجديد'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="category-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit((values) => onSubmit(values))} className="space-y-4">
          <FormField label="الاسم" required error={errors.name?.message}>
            <Input {...register('name')} placeholder="اسم التصنيف" />
          </FormField>

          <FormField label="الوصف" error={errors.description?.message}>
            <Input {...register('description')} placeholder="وصف اختياري" />
          </FormField>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <Label htmlFor="isActive" className="text-sm">نشط</Label>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف التصنيف"
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
              isLoading={deleteMutation.isPending}
            >
              حذف
            </Button>
          </div>
        }
      />
    </AppLayout>
  );
}
