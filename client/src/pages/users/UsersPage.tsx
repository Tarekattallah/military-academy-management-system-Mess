import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
} from '../../lib/api/entities';
import type { User, UserUpdateValues } from '../../types/users';

const createUserSchema = z.object({
  username: z.string().trim().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل').max(50),
  displayName: z.string().trim().min(2, 'الاسم الظاهر يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().trim().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirmPassword: z.string().min(6, 'تأكيد كلمة المرور مطلوب'),
  roles: z.array(z.string()).min(1, 'يجب اختيار دور واحد على الأقل'),
  status: z.enum(['active', 'inactive', 'locked']).default('active'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'كلمة المرور غير متطابقة',
  path: ['confirmPassword'],
});

const updateUserSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  roles: z.array(z.string()).min(1, 'يجب اختيار دور واحد على الأقل'),
  status: z.enum(['active', 'inactive', 'locked']).default('active'),
});

type CreateFormValues = z.infer<typeof createUserSchema>;
type UpdateFormValues = z.infer<typeof updateUserSchema>;

const createEmptyForm = (): CreateFormValues => ({
  username: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  roles: [],
  status: 'active',
});

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  locked: 'مقفل',
};

const statusVariants: Record<string, 'success' | 'secondary' | 'destructive'> = {
  active: 'success',
  inactive: 'secondary',
  locked: 'destructive',
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const canCreate = hasPermission('users:create');
  const canUpdate = hasPermission('users:update');
  const canDelete = hasPermission('users:delete');

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: open,
  });

  const roleOptions = roles.map((r) => ({
    value: r._id,
    label: r.name,
  }));

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      toast.success('تم إنشاء المستخدم بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء المستخدم'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return updateUser(id, {
        displayName: data.displayName,
        email: data.email || undefined,
        roles: data.roles,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      toast.success('تم تحديث المستخدم بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل تحديث المستخدم'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
      toast.success('تم حذف المستخدم بنجاح');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل حذف المستخدم'),
  });

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: createEmptyForm(),
  });

  const updateForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateUserSchema) as any,
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      roles: [],
      status: 'active',
    },
  });

  function handleOpenCreate() {
    setEditing(null);
    createForm.reset(createEmptyForm());
    setOpen(true);
  }

  function handleOpenEdit(user: User) {
    setEditing(user);
    updateForm.reset({
      displayName: user.displayName,
      email: user.email || '',
      password: '',
      roles: user.roles.map((r) => r._id),
      status: user.status,
    });
    setOpen(true);
  }

  function handleCreateSubmit(values: CreateFormValues) {
    createMutation.mutate(values);
  }

  function handleUpdateSubmit(values: UpdateFormValues) {
    if (!editing) return;
    const payload: UserUpdateValues = {
      displayName: values.displayName,
      email: values.email || undefined,
      roles: values.roles,
      status: values.status,
    };
    if (values.password) {
      payload.password = values.password;
    }
    updateMutation.mutate({ id: editing._id, data: payload });
  }

  function handleToggleRole(roleId: string, isCreate: boolean) {
    const form: any = isCreate ? createForm : updateForm;
    const currentRoles = form.getValues('roles') || [];
    const updated = currentRoles.includes(roleId)
      ? currentRoles.filter((id: string) => id !== roleId)
      : [...currentRoles, roleId];
    form.setValue('roles', updated, { shouldValidate: true });
  }

  const columns = [
    {
      accessorKey: 'username',
      header: 'اسم المستخدم',
      cell: ({ row }: { row: { original: User } }) => (
        <span className="font-medium text-foreground">{row.original.username}</span>
      ),
    },
    {
      accessorKey: 'displayName',
      header: 'الاسم الظاهر',
      cell: ({ row }: { row: { original: User } }) => row.original.displayName,
    },
    {
      accessorKey: 'email',
      header: 'البريد الإلكتروني',
      cell: ({ row }: { row: { original: User } }) => row.original.email || '—',
    },
    {
      accessorKey: 'roles',
      header: 'الأدوار',
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge key={role._id} variant="secondary">
              {role.name}
            </Badge>
          ))}
          {row.original.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }: { row: { original: User } }) => (
        <Badge variant={statusVariants[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-1">
          {canUpdate && (
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
              <Pencil className="size-4" />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row.original)} title="حذف">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout title="المستخدمين">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle>قائمة المستخدمين</CardTitle>
          {canCreate && (
            <Button onClick={handleOpenCreate} className="w-full sm:w-auto justify-center">
              <Plus className="size-4" />
              إضافة مستخدم
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
          ) : users.length === 0 ? (
            <EmptyState
              title="لا توجد مستخدمين"
              description="قم بإضافة مستخدم جديد للبدء"
            />
          ) : (
            <DataTable columns={columns} data={users} searchKey="displayName" searchPlaceholder="بحث عن مستخدم..." />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل مستخدم' : 'إضافة مستخدم'}
        description={editing ? 'تعديل بيانات المستخدم' : 'إدخال بيانات المستخدم الجديد'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              form={editing ? 'update-user-form' : 'create-user-form'}
              type="submit"
              isLoading={isSubmitting}
            >
              حفظ
            </Button>
          </div>
        }
      >
        {editing ? (
          <form id="update-user-form" onSubmit={updateForm.handleSubmit((values) => handleUpdateSubmit(values))} className="space-y-4">
            <FormField label="اسم المستخدم" error={updateForm.formState.errors.displayName?.message}>
              <Input value={editing.username} disabled />
            </FormField>

            <FormField label="الاسم الظاهر" required error={updateForm.formState.errors.displayName?.message}>
              <Input {...updateForm.register('displayName')} placeholder="الاسم الظاهر" />
            </FormField>

            <FormField label="البريد الإلكتروني" error={updateForm.formState.errors.email?.message}>
              <Input {...updateForm.register('email')} placeholder="البريد الإلكتروني" type="email" />
            </FormField>

            <FormField label="كلمة المرور (اختياري)" error={updateForm.formState.errors.password?.message}>
              <Input {...updateForm.register('password')} placeholder="اترك فارغاً إذا لم ترد التغيير" type="password" />
            </FormField>

            <div className="space-y-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                الأدوار <span className="mr-1 text-destructive">*</span>
              </label>
              <div className="space-y-1.5">
                {roleOptions.map((role) => (
                  <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateForm.watch('roles')?.includes(role.value) || false}
                      onChange={() => handleToggleRole(role.value, false)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
              {updateForm.formState.errors.roles && (
                <p className="text-xs font-medium text-destructive">{updateForm.formState.errors.roles.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                الحالة
              </label>
              <div className="flex items-center gap-4">
                {(['active', 'inactive', 'locked'] as const).map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={status}
                      checked={updateForm.watch('status') === status}
                      onChange={() => updateForm.setValue('status', status)}
                      className="h-4 w-4 border-input accent-primary"
                    />
                    <span className="text-sm">{statusLabels[status]}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form id="create-user-form" onSubmit={createForm.handleSubmit((values) => handleCreateSubmit(values))} className="space-y-4">
            <FormField label="اسم المستخدم" required error={createForm.formState.errors.username?.message}>
              <Input {...createForm.register('username')} placeholder="اسم المستخدم" />
            </FormField>

            <FormField label="الاسم الظاهر" required error={createForm.formState.errors.displayName?.message}>
              <Input {...createForm.register('displayName')} placeholder="الاسم الظاهر" />
            </FormField>

            <FormField label="البريد الإلكتروني" error={createForm.formState.errors.email?.message}>
              <Input {...createForm.register('email')} placeholder="البريد الإلكتروني" type="email" />
            </FormField>

            <FormField label="كلمة المرور" required error={createForm.formState.errors.password?.message}>
              <Input {...createForm.register('password')} placeholder="كلمة المرور" type="password" />
            </FormField>

            <FormField label="تأكيد كلمة المرور" required error={createForm.formState.errors.confirmPassword?.message}>
              <Input {...createForm.register('confirmPassword')} placeholder="تأكيد كلمة المرور" type="password" />
            </FormField>

            <div className="space-y-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                الأدوار <span className="mr-1 text-destructive">*</span>
              </label>
              <div className="space-y-1.5">
                {roleOptions.map((role) => (
                  <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.watch('roles')?.includes(role.value) || false}
                      onChange={() => handleToggleRole(role.value, true)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
              {createForm.formState.errors.roles && (
                <p className="text-xs font-medium text-destructive">{createForm.formState.errors.roles.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                الحالة
              </label>
              <div className="flex items-center gap-4">
                {(['active', 'inactive', 'locked'] as const).map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={status}
                      checked={createForm.watch('status') === status}
                      onChange={() => createForm.setValue('status', status)}
                      className="h-4 w-4 border-input accent-primary"
                    />
                    <span className="text-sm">{statusLabels[status]}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="حذف المستخدم"
        description={`هل أنت متأكد من حذف "${deleteTarget?.displayName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
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
