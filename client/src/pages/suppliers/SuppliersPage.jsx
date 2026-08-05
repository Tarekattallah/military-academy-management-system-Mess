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
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../lib/api/entities';
import { LogoLoader } from '../../components/ui/LogoLoader';



const supplierSchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب').max(100),
  contactPerson: z.string().trim().max(100).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  taxId: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true)
});



export function SuppliersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission('suppliers:create');
  const canUpdate = hasPermission('suppliers:update');
  const canDelete = hasPermission('suppliers:delete');

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers
  });

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      toast.success('تم إنشاء المورد بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء المورد')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      return updateSupplier(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      toast.success('تم تحديث المورد بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث المورد')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteTarget(null);
      toast.success('تم حذف المورد بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل حذف المورد')
  });

  const form = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      notes: '',
      isActive: true
    }
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxId: '',
      notes: '',
      isActive: true
    });
    setOpen(true);
  }

  function handleOpenEdit(supplier) {
    setEditing(supplier);
    form.reset({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxId: supplier.taxId || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive
    });
    setOpen(true);
  }

  function handleSubmit(values) {
    const payload = {
      ...values,
      contactPerson: values.contactPerson || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      address: values.address || undefined,
      taxId: values.taxId || undefined,
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
    accessorKey: 'contactPerson',
    header: 'جهة الاتصال',
    cell: ({ row }) =>
    <span className="text-muted-foreground">{row.original.contactPerson || '—'}</span>

  },
  {
    accessorKey: 'phone',
    header: 'الهاتف',
    cell: ({ row }) =>
    <span dir="ltr" className="text-muted-foreground">{row.original.phone || '—'}</span>

  },
  {
    accessorKey: 'email',
    header: 'البريد الإلكتروني',
    cell: ({ row }) =>
    <span className="text-muted-foreground">{row.original.email || '—'}</span>

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
    <AppLayout title="الموردين">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة الموردين</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial justify-center"
              onClick={() =>
              exportToCSV(
                suppliers,
                [
                { header: 'الاسم', accessor: (r) => r.name },
                { header: 'اسم المسؤول', accessor: (r) => r.contactPerson || '' },
                { header: 'الهاتف', accessor: (r) => r.phone || '' },
                { header: 'البريد', accessor: (r) => r.email || '' },
                { header: 'العنوان', accessor: (r) => r.address || '' },
                { header: 'الحالة', accessor: (r) => r.isActive ? 'نشط' : 'غير نشط' }],

                'suppliers'
              )
              }>
              
              <Download className="size-4" />
              تصدير
            </Button>
            {canCreate &&
            <Button onClick={handleOpenCreate} className="flex-1 sm:flex-initial justify-center">
                <Plus className="size-4" />
                إضافة مورد
              </Button>
            }
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ?
          <div className="py-12"><LogoLoader /></div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          suppliers.length === 0 ?
          <EmptyState title="لا توجد موردين" description="قم بإضافة مورد جديد للبدء" /> :

          <DataTable columns={columns} data={suppliers} searchKey="name" searchPlaceholder="بحث عن مورد..." />
          }
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل مورد' : 'إضافة مورد'}
        description={editing ? 'تعديل بيانات المورد' : 'إدخال بيانات المورد الجديد'}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="supplier-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }>
        
        <form id="supplier-form" onSubmit={form.handleSubmit((values) => handleSubmit(values))} className="space-y-4">
          <FormField label="الاسم" required error={form.formState.errors.name?.message}>
            <Input {...form.register('name')} placeholder="اسم المورد" />
          </FormField>

          <FormField label="جهة الاتصال" error={form.formState.errors.contactPerson?.message}>
            <Input {...form.register('contactPerson')} placeholder="جهة الاتصال" />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="الهاتف" error={form.formState.errors.phone?.message}>
              <Input {...form.register('phone')} placeholder="رقم الهاتف" dir="ltr" />
            </FormField>

            <FormField label="البريد الإلكتروني" error={form.formState.errors.email?.message}>
              <Input {...form.register('email')} placeholder="البريد الإلكتروني" type="email" />
            </FormField>
          </div>

          <FormField label="العنوان" error={form.formState.errors.address?.message}>
            <Input {...form.register('address')} placeholder="العنوان" />
          </FormField>

          <FormField label="الرقم الضريبي" error={form.formState.errors.taxId?.message}>
            <Input {...form.register('taxId')} placeholder="الرقم الضريبي" />
          </FormField>

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
        title="حذف المورد"
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