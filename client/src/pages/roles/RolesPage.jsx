import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tag } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../../lib/api/entities';


const roleSchema = z.object({
  name: z.string().trim().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  description: z.string().trim().optional().or(z.literal('')),
  permissions: z.array(z.string()).optional().default([])
});



export function RolesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission('roles:create');
  const canUpdate = hasPermission('roles:update');
  const canDelete = hasPermission('roles:delete');

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissions,
    enabled: open
  });

  const permissionsByModule = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
      toast.success('تم إنشاء الدور بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنشاء الدور')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      const payload = {};
      if (data.name) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description || '';
      if (data.permissions) payload.permissions = data.permissions;
      return updateRole(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
      toast.success('تم تحديث الدور بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث الدور')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteTarget(null);
      toast.success('تم حذف الدور بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل حذف الدور')
  });

  const form = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '', permissions: [] }
  });

  function handleOpenCreate() {
    setEditing(null);
    form.reset({ name: '', description: '', permissions: [] });
    setOpen(true);
  }

  function handleOpenEdit(role) {
    setEditing(role);
    form.reset({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions.map((p) => p._id)
    });
    setOpen(true);
  }

  function handleSubmit(values) {
    if (editing) {
      updateMutation.mutate({ id: editing._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleTogglePermission(permId) {
    const current = form.getValues('permissions');
    const updated = current.includes(permId) ?
    current.filter((id) => id !== permId) :
    [...current, permId];
    form.setValue('permissions', updated, { shouldValidate: true });
  }

  function getPermissionTone(count) {
    if (count === 0) return 'neutral';
    if (count <= 5) return 'olive';
    if (count <= 15) return 'rust';
    return 'brick';
  }

  const columns = [
  {
    accessorKey: 'name',
    header: 'الاسم',
    cell: ({ row }) =>
    <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{row.original.name}</span>
          {row.original.isSystem &&
      <span title="دور نظام">
              <Shield className="size-4 text-primary" />
            </span>
      }
        </div>

  },
  {
    accessorKey: 'description',
    header: 'الوصف',
    cell: ({ row }) =>
    <span className="text-muted-foreground">{row.original.description || '—'}</span>

  },
  {
    accessorKey: 'permissions',
    header: 'الصلاحيات',
    cell: ({ row }) =>
    <div className="flex items-center gap-2">
          <Tag tone={getPermissionTone(row.original.permissions.length)}>
            {row.original.permissions.length}
          </Tag>
          <span className="text-xs text-muted-foreground">
            صلاحية{row.original.permissions.length !== 1 ? 'ات' : ''}
          </span>
        </div>

  },
  {
    accessorKey: 'isSystem',
    header: 'نظام',
    cell: ({ row }) =>
    row.original.isSystem ?
    <Badge variant="success">نظام</Badge> :

    <Badge variant="secondary">مخصص</Badge>

  },
  {
    id: 'actions',
    header: 'إجراءات',
    cell: ({ row }) =>
    <div className="flex items-center gap-1">
          {canUpdate && !row.original.isSystem &&
      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
              <Pencil className="size-4" />
            </Button>
      }
          {canDelete && !row.original.isSystem &&
      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)} title="حذف">
              <Trash2 className="size-4 text-destructive" />
            </Button>
      }
        </div>

  }];


  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout title="الصلاحيات">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة الأدوار</CardTitle>
          {canCreate &&
          <Button onClick={handleOpenCreate} className="w-full sm:w-auto justify-center">
              <Plus className="size-4" />
              إضافة دور
            </Button>
          }
        </CardHeader>
        <CardContent>
          {isLoading ?
          <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) =>
            <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
            )}
            </div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          roles.length === 0 ?
          <EmptyState title="لا توجد أدوار" description="قم بإضافة دور جديد للبدء" /> :

          <DataTable columns={columns} data={roles} searchKey="name" searchPlaceholder="بحث عن دور..." />
          }
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل دور' : 'إضافة دور'}
        description={editing ? 'تعديل بيانات الدور والصلاحيات' : 'إدخال بيانات الدور الجديد'}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button form="role-form" type="submit" isLoading={isSubmitting}>
              حفظ
            </Button>
          </div>
        }>
        
        <form id="role-form" onSubmit={form.handleSubmit((values) => handleSubmit(values))} className="space-y-4">
          <FormField label="الاسم" required error={form.formState.errors.name?.message}>
            <Input {...form.register('name')} placeholder="اسم الدور" />
          </FormField>

          <FormField label="الوصف" error={form.formState.errors.description?.message}>
            <Input {...form.register('description')} placeholder="وصف الدور" />
          </FormField>

          <div className="space-y-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              الصلاحيات
            </label>
            {Object.keys(permissionsByModule).length === 0 ?
            <p className="text-xs text-muted-foreground py-2">جاري تحميل الصلاحيات...</p> :

            <div className="max-h-64 overflow-y-auto space-y-3 border border-border rounded-md p-3">
                {Object.entries(permissionsByModule).map(([module, perms]) =>
              <div key={module}>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 border-b border-border pb-1">
                      {module}
                    </p>
                    <div className="space-y-1 pr-2">
                      {perms.map((perm) =>
                  <label key={perm._id} className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                      type="checkbox"
                      checked={form.watch('permissions')?.includes(perm._id) || false}
                      onChange={() => handleTogglePermission(perm._id)}
                      className="h-4 w-4 rounded border-input accent-primary" />
                    
                          <span className="text-sm">{perm.code}</span>
                          {perm.description &&
                    <span className="text-xs text-muted-foreground">— {perm.description}</span>
                    }
                        </label>
                  )}
                    </div>
                  </div>
              )}
              </div>
            }
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف الدور"
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