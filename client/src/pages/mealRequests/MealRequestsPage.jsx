import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Eye, Check, X } from 'lucide-react';
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
  getMealRequests,
  createMealRequest,
  updateMealRequest,
  approveMealRequest,
  rejectMealRequest,
  getMenus,
  getRecipes } from
'../../lib/api/entities';




const mealRequestItemSchema = z.object({
  recipe: z.string().min(1, 'الوصفة مطلوبة'),
  requestedServings: z.coerce.number().min(1, 'عدد الحصص يجب أن يكون 1 على الأقل')
});

const mealRequestSchema = z.object({
  requestingUnit: z.string().trim().min(1, 'الوحدة الطالبة مطلوبة'),
  menu: z.string().min(1, 'قائمة الطعام مطلوبة'),
  notes: z.string().trim().optional().default(''),
  items: z.array(mealRequestItemSchema).min(1, 'يجب إضافة صنف واحد على الأقل للطلب')
});



const emptyForm = () => ({
  requestingUnit: '',
  menu: '',
  notes: '',
  items: [{ recipe: '', requestedServings: 100 }]
});

const statusLabels = {
  draft: 'مسودة',
  submitted: 'مقدم',
  approved: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل'
};

const statusVariants = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
  rejected: 'destructive',
  completed: 'success'
};

export function MealRequestsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const canCreate = hasPermission('meal-requests:create');
  const canUpdate = hasPermission('meal-requests:update');
  const canApprove = hasPermission('meal-requests:approve');

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['meal-requests'],
    queryFn: () => getMealRequests()
  });

  const { data: menus = [] } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
    enabled: open
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes,
    enabled: open
  });

  const publishedMenus = menus.filter((m) => m.status === 'published' || m.status === 'closed');

  const createMutation = useMutation({
    mutationFn: createMealRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-requests'] });
      setOpen(false);
      toast.success('تم تقديم طلب الوجبات بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تقديم طلب الوجبات')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMealRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-requests'] });
      setOpen(false);
      setEditing(null);
      toast.success('تم تحديث الطلب بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل تحديث الطلب')
  });

  const approveMutation = useMutation({
    mutationFn: approveMealRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-requests'] });
      setViewTarget(null);
      toast.success('تمت الموافقة على الطلب بنجاح وتم إنشاء الحجز');
    },
    onError: (err) => toast.error(err.message || 'فشل الموافقة على الطلب')
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectMealRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-requests'] });
      setRejectId(null);
      setRejectReason('');
      setViewTarget(null);
      toast.success('تم رفض الطلب بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل رفض الطلب')
  });

  const form = useForm({
    resolver: zodResolver(mealRequestSchema),
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

  function handleOpenEdit(req) {
    setEditing(req);
    form.reset({
      requestingUnit: req.requestingUnit,
      menu: req.menu?._id || '',
      notes: req.notes || '',
      items: req.items.map((item) => ({
        recipe: item.recipe?._id || '',
        requestedServings: item.requestedServings
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
    accessorKey: 'requestNumber',
    header: 'رقم الطلب',
    cell: ({ row }) =>
    <span className="font-mono text-xs font-semibold">{row.original.requestNumber}</span>

  },
  {
    accessorKey: 'requestingUnit',
    header: 'الجهة الطالبة (الوحدة)',
    cell: ({ row }) =>
    <span className="font-medium text-foreground">{row.original.requestingUnit}</span>

  },
  {
    accessorKey: 'menu',
    header: 'تاريخ وجبة القائمة',
    cell: ({ row }) =>
    row.original.menu ?
    `${new Date(row.original.menu.menuDate).toLocaleDateString('ar-EG')} (${
    row.original.menu.mealType === 'breakfast' ?
    'فطور' :
    row.original.menu.mealType === 'lunch' ?
    'غداء' :
    'عشاء'})` :

    '—'
  },
  {
    accessorKey: 'status',
    header: 'الحالة',
    cell: ({ row }) =>
    <Badge variant={statusVariants[row.original.status] || 'secondary'}>
          {statusLabels[row.original.status] || row.original.status}
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
          {canUpdate && row.original.status === 'draft' &&
      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(row.original)} title="تعديل">
              <Pencil className="size-4" />
            </Button>
      }
          {canApprove && row.original.status === 'submitted' &&
      <>
              <Button
          variant="ghost"
          size="icon"
          onClick={() => approveMutation.mutate(row.original._id)}
          title="موافقة"
          className="text-success hover:bg-success/15">
          
                <Check className="size-4" />
              </Button>
              <Button
          variant="ghost"
          size="icon"
          onClick={() => setRejectId(row.original._id)}
          title="رفض"
          className="text-destructive hover:bg-destructive/15">
          
                <X className="size-4" />
              </Button>
            </>
      }
        </div>

  }];


  return (
    <AppLayout title="طلبات الوجبات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة طلبات التموين والوجبات</CardTitle>
          {canCreate &&
          <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              تقديم طلب جديد
            </Button>
          }
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
          requests.length === 0 ?
          <EmptyState title="لا توجد طلبات وجبات" description="لم يتم تقديم أي طلبات وجبات حتى الآن" /> :

          <DataTable columns={columns} data={requests} searchKey="requestNumber" searchPlaceholder="بحث برقم الطلب..." />
          }
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title={`تفاصيل طلب الوجبة ${viewTarget?.requestNumber || ''}`}
        description={`تاريخ التقديم: ${viewTarget ? new Date(viewTarget.requestDate).toLocaleDateString('ar-EG') : ''}`}
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              إغلاق
            </Button>
            {canApprove && viewTarget?.status === 'submitted' &&
          <>
                <Button
              variant="destructive"
              onClick={() => setRejectId(viewTarget._id)}>
              
                  رفض الطلب
                </Button>
                <Button
              onClick={() => approveMutation.mutate(viewTarget._id)}
              isLoading={approveMutation.isPending}>
              
                  الموافقة واعتماد الحجز
                </Button>
              </>
          }
          </div>
        }>
        
        {viewTarget &&
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b border-border pb-4">
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">الجهة الطالبة</span>
                <span className="font-semibold text-foreground">{viewTarget.requestingUnit}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">حالة الطلب</span>
                <Badge variant={statusVariants[viewTarget.status] || 'secondary'}>
                  {statusLabels[viewTarget.status] || viewTarget.status}
                </Badge>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">مقدم الطلب</span>
                <span className="font-semibold text-foreground">{viewTarget.requestedBy?.displayName}</span>
              </div>
              {viewTarget.approvedBy &&
            <div>
                  <span className="block text-xs text-muted-foreground font-medium mb-0.5">المعتمِد</span>
                  <span className="font-semibold text-foreground">{viewTarget.approvedBy?.displayName}</span>
                </div>
            }
              {viewTarget.notes &&
            <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground font-medium mb-0.5">ملاحظات</span>
                  <p className="text-foreground bg-secondary/35 p-2 rounded-md">{viewTarget.notes}</p>
                </div>
            }
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">الوجبات والأعداد المطلوبة</h3>
              <div className="border border-border rounded-md divide-y divide-border">
                {viewTarget.items.map((item, idx) =>
              <div key={idx} className="flex justify-between items-center p-3 text-sm">
                    <span className="font-bold text-foreground">{item.recipe?.name}</span>
                    <span className="font-semibold text-primary">
                      {item.requestedServings.toLocaleString('ar-EG')} حصة مطلوبة
                    </span>
                  </div>
              )}
              </div>
            </div>
          </div>
        }
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog
        open={!!rejectId}
        onOpenChange={(v) => !v && setRejectId(null)}
        title="رفض طلب التموين"
        description="يرجى كتابة سبب الرفض لتوضيحه للجهة الطالبة"
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectId(null)}>
              إلغاء
            </Button>
            <Button
            variant="destructive"
            onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
            isLoading={rejectMutation.isPending}
            disabled={!rejectReason.trim()}>
            
              تأكيد الرفض
            </Button>
          </div>
        }>
        
        <FormField label="سبب الرفض" required>
          <Input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="اكتب سبب الرفض هنا..." />
          
        </FormField>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'تعديل طلب وجبات' : 'تقديم طلب وجبات جديد'}
        description="إدخال بيانات الطلب والكميات المطلوبة لكل وحدة تموين"
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={form.formState.isSubmitting}>
              إلغاء
            </Button>
            <Button form="meal-request-form" type="submit" isLoading={form.formState.isSubmitting}>
              تقديم الطلب
            </Button>
          </div>
        }>
        
        <form id="meal-request-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="الوحدة الطالبة" required error={form.formState.errors.requestingUnit?.message}>
              <Input {...form.register('requestingUnit')} placeholder="مثال: الكتيبة الأولى" />
            </FormField>

            <SelectField
              control={form.control}
              name="menu"
              label="قائمة الطعام المرتبطة"
              required
              placeholder="اختر القائمة اليومية"
              options={publishedMenus.map((m) => ({
                value: m._id,
                label: `${new Date(m.menuDate).toLocaleDateString('ar-EG')} - ${mealTypeLabels[m.mealType]}`
              }))}
              error={form.formState.errors.menu?.message} />
            
          </div>

          <FormField label="ملاحظات" error={form.formState.errors.notes?.message}>
            <Input {...form.register('notes')} placeholder="مثال: طلب وجبة عشاء استثنائي للكتيبة" />
          </FormField>

          {/* Items array */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                الوجبات والأعداد المطلوبة <span className="text-destructive">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ recipe: '', requestedServings: 100 })}>
                
                + إضافة صنف
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
                    name={`items.${index}.recipe`}
                    placeholder="اختر الوصفة"
                    options={recipes.filter((r) => r.status === 'active').map((r) => ({ value: r._id, label: r.name }))}
                    error={form.formState.errors.items?.[index]?.recipe?.message} />
                  
                  </div>
                  <div className="w-36">
                    <FormField error={form.formState.errors.items?.[index]?.requestedServings?.message}>
                      <Input
                      type="number"
                      placeholder="عدد الحصص المطلوبة"
                      {...form.register(`items.${index}.requestedServings`)} />
                    
                    </FormField>
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
        </form>
      </Dialog>
    </AppLayout>);

}

const Trash2 = (props) =>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>;


const mealTypeLabels = {
  breakfast: 'فطور',
  lunch: 'غداء',
  dinner: 'عشاء'
};