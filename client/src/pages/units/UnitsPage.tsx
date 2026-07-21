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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from '../../lib/api/entities';
import type { Unit } from '../../types/products';
import { Label } from '../../components/ui/Input';

const unitSchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب').max(50),
  abbreviation: z.string().trim().min(1, 'الاختصار مطلوب').max(10),
  category: z.enum(['weight', 'volume', 'quantity', 'length', 'other'], {
    required_error: 'الفئة مطلوبة',
  }),
  description: z.string().trim().max(500).optional().default(''),
  isActive: z.boolean().default(true),
});

type UnitFormValues = z.infer<typeof unitSchema>;

const emptyForm: UnitFormValues = {
  name: '',
  abbreviation: '',
  category: 'quantity',
  description: '',
  isActive: true,
};

const categoryOptions = [
  { value: 'weight', label: 'وزن' },
  { value: 'volume', label: 'حجم' },
  { value: 'quantity', label: 'كمية' },
  { value: 'length', label: 'طول' },
  { value: 'other', label: 'أخرى' },
];

export function UnitsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const { data: units = [], isLoading, error } = useQuery({
    queryKey: ['units'],
    queryFn: getUnits,
  });

  const createMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setOpen(false);
      toast.success('تم إنشاء الوحدة بنجاح');
    },
    onError: () => toast.error('فشل إنشاء الوحدة'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Unit> }) => updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setOpen(false);
      setEditing(null);
      toast.success('تم تحديث الوحدة بنجاح');
    },
    onError: () => toast.error('فشل تحديث الوحدة'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setDeleteTarget(null);
      toast.success('تم حذف الوحدة بنجاح');
    },
    onError: () => toast.error('فشل حذف الوحدة'),
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: emptyForm,
  });

  function handleOpenCreate() {
    setEditing(null);
    reset(emptyForm);
    setOpen(true);
  }

  function handleOpenEdit(unit: Unit) {
    setEditing(unit);
    reset({
      name: unit.name,
      abbreviation: unit.abbreviation,
      category: unit.category,
      description: unit.description || '',
      isActive: unit.isActive,
    });
    setOpen(true);
  }

  function onSubmit(values: UnitFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const categoryLabel = (cat: string) => categoryOptions.find((o) => o.value === cat)?.label || cat;

  const columns = [
    {
      accessorKey: 'name',
      header: 'الوحدة',
      cell: ({ row }: { row: { original: Unit } }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'abbreviation',
      header: 'الاختصار',
      cell: ({ row }: { row: { original: Unit } }) => (
        <span className="font-mono text-xs">{row.original.abbreviation}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'الفئة',
      cell: ({ row }: { row: { original: Unit } }) => categoryLabel(row.original.category),
    },
    {
      accessorKey: 'description',
      header: 'الوصف',
      cell: ({ row }: { row: { original: Unit } }) => row.original.description || '—',
    },
    {
      accessorKey: 'isActive',
      header: 'الحالة',
      cell: ({ row }: { row: { original: Unit } }) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
          {row.original.isActive ? 'نشط' : 'غير نشط'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: Unit } }) => (
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
    <AppLayout title="الوحدات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الوحدات</CardTitle>
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" />
            إضافة وحدة
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
          ) : units.length === 0 ? (
            <EmptyState
              title="لا توجد وحدات"
              description="قم بإضافة وحدة جديدة للبدء"
            />
          ) : (
            <DataTable columns={columns} data={units} searchKey="name" searchPlaceholder="بحث عن وحدة..." />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل وحدة' : 'إضافة وحدة'}
        description={editing ? 'تعديل بيانات الوحدة' : 'إدخال بيانات الوحدة الجديدة'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="unit-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }
      >
        <form id="unit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الاسم" required error={errors.name?.message}>
              <Input {...register('name')} placeholder="اسم الوحدة" />
            </FormField>

            <FormField label="الاختصار" required error={errors.abbreviation?.message}>
              <Input {...register('abbreviation')} placeholder="مثال: كجم" />
            </FormField>
          </div>

          <SelectField
            control={control}
            name="category"
            label="الفئة"
            required
            placeholder="اختر الفئة"
            options={categoryOptions}
            error={errors.category?.message}
          />

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
        title="حذف الوحدة"
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
