import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '../../lib/csvExport';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../../lib/api/entities';



const warehouseSchema = z.object({
  name: z.string().trim().min(1, 'اسم المستودع مطلوب').max(100),
  code: z.string().trim().min(1, 'كود المستودع مطلوب').max(20),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  manager: z.string().trim().max(100).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});



export function WarehousesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission('warehouses:create');
  const canUpdate = hasPermission('warehouses:update');
  const canDelete = hasPermission('warehouses:delete');

  const { data: warehouses = [], isLoading, error } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses
  });

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setOpen(false);
      toast.success('تم إنشاء المستودع بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء المستودع')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      return updateWarehouse(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setOpen(false);
      toast.success('تم تحديث المستودع بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث المستودع')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setDeleteTarget(null);
      toast.success('تم حذف المستودع بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل حذف المستودع')
  });

  const form = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      manager: '',
      phone: '',
      notes: '',
      isActive: true
    }
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset({
      name: '',
      code: '',
      location: '',
      manager: '',
      phone: '',
      notes: '',
      isActive: true
    });
    setOpen(true);
  }

  function handleOpenEdit(warehouse) {
    setEditing(warehouse);
    form.reset({
      name: warehouse.name,
      code: warehouse.code,
      location: warehouse.location || '',
      manager: warehouse.manager || '',
      phone: warehouse.phone || '',
      notes: warehouse.notes || '',
      isActive: warehouse.isActive
    });
    setOpen(true);
  }

  function handleSubmit(values) {
    const payload = {
      ...values,
      location: values.location || undefined,
      manager: values.manager || undefined,
      phone: values.phone || undefined,
      notes: values.notes || undefined
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
    header: 'الاسم',
    cell: ({ row }) =>
    <span className="font-medium text-foreground">{row.original.name}</span>

  },
  {
    accessorKey: 'code',
    header: 'الكود',
    cell: ({ row }) =>
    <span className="font-mono text-muted-foreground">{row.original.code}</span>

  },
  {
    accessorKey: 'location',
    header: 'الموقع',
    cell: ({ row }) =>
    <span className="text-muted-foreground">{row.original.location || '—'}</span>

  },
  {
    accessorKey: 'manager',
    header: 'المسؤول',
    cell: ({ row }) =>
    <span className="text-muted-foreground">{row.original.manager || '—'}</span>

  },
  {
    accessorKey: 'phone',
    header: 'الهاتف',
    cell: ({ row }) =>
    <span dir="ltr" className="text-muted-foreground">{row.original.phone || '—'}</span>

  },
  {
    accessorKey: 'isActive',
    header: 'الحالة',
    cell: ({ row }) =>
    row.original.isActive ?
    <Badge variant="success">نشط</Badge> :

    <Badge variant="secondary">غير نشط</Badge>


  },
  {
    id: 'actions',
    header: 'إجراءات',
    cell: ({ row }) =>
    <div className="flex items-center gap-1">
          {canUpdate &&
      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
              <Pencil className="size-4" />
            </Button>
      }
          {canDelete &&
      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)} title="حذف">
              <Trash2 className="size-4 text-destructive" />
            </Button>
      }
        </div>

  }];


  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout title="المستودعات">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة المستودعات</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial justify-center"
              onClick={() =>
              exportToCSV(
                warehouses,
                [
                { header: 'الاسم', accessor: (r) => r.name },
                { header: 'الكود', accessor: (r) => r.code || '' },
                { header: 'الموقع', accessor: (r) => r.location || '' },
                { header: 'الحالة', accessor: (r) => r.isActive ? 'نشط' : 'غير نشط' }],

                'warehouses'
              )
              }>
              
              <Download className="size-4" />
              تصدير
            </Button>
            {canCreate &&
            <Button onClick={handleOpenCreate} className="flex-1 sm:flex-initial justify-center">
                <Plus className="size-4" />
                إضافة مستودع
              </Button>
            }
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
          warehouses.length === 0 ?
          <EmptyState title="لا توجد مستودعات" description="قم بإضافة مستودع جديد للبدء" /> :

          <DataTable columns={columns} data={warehouses} searchKey="name" searchPlaceholder="بحث عن مستودع..." />
          }
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل مستودع' : 'إضافة مستودع'}
        description={editing ? 'تعديل بيانات المستودع' : 'إدخال بيانات المستودع الجديد'}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="warehouse-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }>
        
        <form id="warehouse-form" onSubmit={form.handleSubmit((values) => handleSubmit(values))} className="space-y-4">
          <FormField label="الاسم" required error={form.formState.errors.name?.message}>
            <Input {...form.register('name')} placeholder="اسم المستودع" />
          </FormField>

          <FormField label="الكود" required error={form.formState.errors.code?.message}>
            <Input {...form.register('code')} placeholder="كود المستودع" />
          </FormField>

          <FormField label="الموقع" error={form.formState.errors.location?.message}>
            <Input {...form.register('location')} placeholder="موقع المستودع" />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="المسؤول" error={form.formState.errors.manager?.message}>
              <Input {...form.register('manager')} placeholder="اسم المسؤول" />
            </FormField>

            <FormField label="الهاتف" error={form.formState.errors.phone?.message}>
              <Input {...form.register('phone')} placeholder="رقم الهاتف" dir="ltr" />
            </FormField>
          </div>

          <FormField label="ملاحظات" error={form.formState.errors.notes?.message}>
            <Input {...form.register('notes')} placeholder="ملاحظات" />
          </FormField>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.watch('isActive')}
              onChange={(e) => form.setValue('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary" />
            
            <label htmlFor="isActive" className="text-sm cursor-pointer">نشط</label>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف المستودع"
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