import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye, X, Utensils } from 'lucide-react';
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
  getMealDistributions,
  createMealDistribution,
  completeMealDistribution,
  cancelMealDistribution,
  getReservations } from
'../../lib/api/entities';



const distributionFormSchema = z.object({
  reservation: z.string().min(1, 'الحجز مطلوب'),
  notes: z.string().trim().optional().default('')
});



const completeItemSchema = z.object({
  product: z.string(),
  batch: z.string(),
  productName: z.string(),
  batchNumber: z.string(),
  plannedQuantity: z.number(),
  issuedQuantity: z.coerce.number().min(0, 'الكمية المنصرفة يجب أن تكون 0 أو أكثر'),
  actualQuantity: z.coerce.number().min(0, 'الكمية المستهلكة يجب أن تكون 0 أو أكثر'),
  wastageQuantity: z.coerce.number().min(0, 'كمية الهدر يجب أن تكون 0 أو أكثر'),
  returnedQuantity: z.coerce.number().min(0, 'الكمية المرتجعة يجب أن تكون 0 أو أكثر')
}).refine(data => data.issuedQuantity <= data.plannedQuantity, {
  message: 'الكمية المنصرفة للمطبخ لا يمكن أن تتجاوز المخطط',
  path: ['issuedQuantity']
}).refine(data => {
  const accounted = data.actualQuantity + data.wastageQuantity + data.returnedQuantity;
  return Math.abs(data.issuedQuantity - accounted) < 0.001;
}, {
  message: 'خطأ: المنصرف يجب أن يساوي (المستهلك + الهدر + المرتجع)',
  path: ['issuedQuantity']
});

const completeSchema = z.object({
  notes: z.string().trim().optional().default(''),
  plannedServings: z.number().optional(),
  actualServings: z.coerce.number().min(0, 'يجب أن يكون العدد الفعلي للوجبات 0 أو أكثر'),
  items: z.array(completeItemSchema)
}).refine(data => data.actualServings <= (data.plannedServings || 0), {
  message: 'العدد الفعلي للوجبات لا يمكن أن يتجاوز العدد المخطط',
  path: ['actualServings']
});



const statusLabels = {
  draft: 'مسودة',
  in_progress: 'قيد التحضير',
  completed: 'مكتمل (موزع)',
  cancelled: 'ملغي'
};

const statusVariants = {
  draft: 'secondary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive'
};

export function MealAttendancePage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const canCreate = hasPermission('meal-attendance:create') || hasPermission('meal-distributions:create');
  const canUpdate = hasPermission('meal-attendance:update') || hasPermission('meal-distributions:update');

  const { data: distributions = [], isLoading, error } = useQuery({
    queryKey: ['meal-distributions'],
    queryFn: () => getMealDistributions()
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => getReservations(),
    enabled: open
  });

  // Only active reservations can be distributed
  const activeReservations = reservations.filter((r) => r.status === 'reserved');

  const createMutation = useMutation({
    mutationFn: createMealDistribution,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-distributions'] });
      setOpen(false);
      toast.success('تم البدء في تحضير وتوزيع الوجبة بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل البدء في التوزيع')
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => completeMealDistribution(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-distributions'] });
      setCompleteTarget(null);
      setViewTarget(null);
      toast.success('تم إنهاء التوزيع وخصم الكميات من المخزون بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إنهاء التوزيع')
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => cancelMealDistribution(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-distributions'] });
      setCancelId(null);
      setCancelReason('');
      setViewTarget(null);
      toast.success('تم إلغاء التوزيع بنجاح');
    },
    onError: (err) => toast.error(err.message || 'فشل إلغاء التوزيع')
  });

  const form = useForm({
    resolver: zodResolver(distributionFormSchema),
    defaultValues: { reservation: '', notes: '' }
  });

  const completeForm = useForm({
    resolver: zodResolver(completeSchema)
  });

  const { fields: completeFields } = useFieldArray({
    control: completeForm.control,
    name: 'items'
  });

  function handleOpenCreate() {
    form.reset({ reservation: '', notes: '' });
    setOpen(true);
  }

  function handleOpenComplete(dist) {
    completeForm.reset({
      notes: dist.notes || '',
      plannedServings: dist.plannedServings || 0,
      actualServings: dist.plannedServings || 0, // default to planned
      items: dist.items.map((item) => ({
        product: item.product?._id || item.product,
        batch: item.batch?._id || item.batch,
        productName: item.product?.name || 'منتج',
        batchNumber: item.batch?.batchNumber || 'دفعة',
        plannedQuantity: item.plannedQuantity,
        issuedQuantity: item.plannedQuantity, // default issued to planned
        actualQuantity: item.plannedQuantity, // default actual to planned
        wastageQuantity: 0,
        returnedQuantity: 0
      }))
    });
    setCompleteTarget(dist);
  }

  function onSubmitCreate(values) {
    createMutation.mutate(values);
  }

  function onSubmitComplete(values) {
    if (!completeTarget) return;
    completeMutation.mutate({
      id: completeTarget._id,
      data: {
        actualServings: values.actualServings,
        items: values.items.map((it) => ({
          product: it.product,
          batch: it.batch,
          issuedQuantity: it.issuedQuantity,
          actualQuantity: it.actualQuantity,
          wastageQuantity: it.wastageQuantity,
          returnedQuantity: it.returnedQuantity
        })),
        notes: values.notes
      }
    });
  }

  const columns = [
  {
    accessorKey: 'distributionNumber',
    header: 'رقم التحضير/التوزيع',
    cell: ({ row }) =>
    <span className="font-mono text-xs font-semibold">{row.original.distributionNumber}</span>

  },
  {
    accessorKey: 'requestingUnit',
    header: 'الكتيبة / الجهة الطالبة',
    cell: ({ row }) => row.original.requestingUnit || '—'
  },
  {
    accessorKey: 'distributionDate',
    header: 'تاريخ التحضير',
    cell: ({ row }) =>
    row.original.distributionDate ? new Date(row.original.distributionDate).toLocaleDateString('ar-EG') : '—'
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
          {canUpdate && (row.original.status === 'draft' || row.original.status === 'in_progress') &&
      <>
              <Button
          variant="outline"
          size="sm"
          onClick={() => handleOpenComplete(row.original)}
          className="text-success border-success hover:bg-success/10 flex items-center gap-1">
          
                <Utensils className="size-3.5" />
                إنهاء وتوزيع
              </Button>
              <Button
          variant="ghost"
          size="icon"
          onClick={() => setCancelId(row.original._id)}
          className="text-destructive hover:bg-destructive/10"
          title="إلغاء التوزيع">
          
                <X className="size-4" />
              </Button>
            </>
      }
        </div>

  }];


  return (
    <AppLayout title="تحضير وتوزيع الوجبات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>عمليات المطبخ العسكري وتوزيع الحصص اليومية</CardTitle>
          {canCreate &&
          <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              بدء تحضير وجبة
            </Button>
          }
        </CardHeader>
        <CardContent>
          {isLoading ?
          <div className="py-12"><LogoLoader /></div> :
          error ?
          <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات: {error.message}</div> :
          distributions.length === 0 ?
          <EmptyState title="لا توجد عمليات تحضير" description="لم يتم تسجيل أي عمليات تحضير أو توزيع وجبات حتى الآن" /> :

          <DataTable
            columns={columns}
            data={distributions}
            searchKey="distributionNumber"
            searchPlaceholder="بحث برقم التوزيع..." />

          }
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title={`تفاصيل عملية تحضير وتوزيع الوجبة ${viewTarget?.distributionNumber || ''}`}
        description={`تاريخ العملية: ${
        viewTarget?.distributionDate ? new Date(viewTarget.distributionDate).toLocaleDateString('ar-EG') : ''}`
        }
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              إغلاق
            </Button>
            {canUpdate && (viewTarget?.status === 'draft' || viewTarget?.status === 'in_progress') &&
          <>
                <Button variant="destructive" onClick={() => setCancelId(viewTarget._id)}>
                  إلغاء العملية
                </Button>
                <Button onClick={() => handleOpenComplete(viewTarget)}>إنهاء وتوزيع الحصص</Button>
              </>
          }
          </div>
        }>
        
        {viewTarget &&
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b border-border pb-4">
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">الحجز المرتبط</span>
                <span className="font-semibold text-foreground">{viewTarget.reservation?.reservationNumber}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">الجهة المستلمة</span>
                <span className="font-semibold text-foreground">{viewTarget.requestingUnit}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">الحالة</span>
                <Badge variant={statusVariants[viewTarget.status] || 'secondary'}>
                  {statusLabels[viewTarget.status] || viewTarget.status}
                </Badge>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">المسؤول عن التوزيع</span>
                <span className="font-semibold text-foreground">{viewTarget.distributedBy?.displayName}</span>
              </div>
              {viewTarget.notes &&
            <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground font-medium mb-0.5">ملاحظات</span>
                  <p className="text-foreground bg-secondary/35 p-2 rounded-md">{viewTarget.notes}</p>
                </div>
            }
              {viewTarget.status === 'cancelled' && viewTarget.cancelReason &&
            <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground font-medium mb-0.5 text-destructive">سبب الإلغاء</span>
                  <p className="text-destructive bg-destructive/10 p-2 rounded-md font-medium">{viewTarget.cancelReason}</p>
                </div>
            }
            </div>

            {/* Cost Snapshot Section */}
            {viewTarget.status === 'completed' && viewTarget.totalStandardCost !== undefined && (
              <div className="mt-4 p-4 bg-secondary/30 border border-border rounded-md">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center justify-between border-b border-border pb-2">
                  <span>تحليل التكاليف (Cost Snapshot)</span>
                  <Badge variant={viewTarget.varianceAmount > 0 ? 'destructive' : 'success'}>
                    انحراف: {viewTarget.variancePercentage?.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}%
                  </Badge>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-medium mb-1">إجمالي التكلفة المعيارية</span>
                    <span className="font-mono text-sm font-semibold">{viewTarget.totalStandardCost?.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-medium mb-1">إجمالي التكلفة الفعلية (الاستهلاك)</span>
                    <span className="font-mono text-sm font-semibold text-primary">{viewTarget.totalActualCost?.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-medium mb-1">تكلفة الهدر</span>
                    <span className="font-mono text-sm font-semibold text-destructive">{viewTarget.totalWasteCost?.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-medium mb-1">التكلفة التشغيلية (الفعلي + الهدر)</span>
                    <span className="font-mono text-sm font-semibold text-orange-600">{(viewTarget.totalActualCost + viewTarget.totalWasteCost)?.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-medium mb-1">التكلفة المعيارية للفرد</span>
                    <span className="font-mono text-sm font-medium">{viewTarget.standardCostPerServing?.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground font-medium mb-1">التكلفة الفعلية للفرد</span>
                    <span className="font-mono text-sm font-medium">{viewTarget.actualCostPerServing?.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-muted-foreground font-medium mb-1">قيمة الانحراف (الفعلي - المعياري)</span>
                    <span className={`font-mono text-sm font-bold ${viewTarget.varianceAmount > 0 ? 'text-destructive' : 'text-success'}`}>
                      {viewTarget.varianceAmount > 0 ? '+' : ''}{viewTarget.varianceAmount?.toLocaleString('ar-EG')} ج.م
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <h3 className="text-sm font-bold text-foreground mb-2">الأصناف المحضرة والمواد المستهلكة</h3>
              <div className="border border-border rounded-md divide-y divide-border overflow-x-auto">
                <table className="w-full text-sm text-right text-foreground">
                  <thead className="bg-secondary/40 text-xs text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-2">المنتج</th>
                      <th className="p-2">رقم الدفعة</th>
                      <th className="p-2">الكمية المخططة</th>
                      <th className="p-2">الموزعة فعلياً</th>
                      <th className="p-2">الهدر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewTarget.items.map((item, idx) =>
                  <tr key={idx} className="border-t border-border">
                        <td className="p-2 font-medium">{item.product?.name}</td>
                        <td className="p-2 font-mono text-xs">{item.batch?.batchNumber}</td>
                        <td className="p-2 font-mono">{item.plannedQuantity.toLocaleString('ar-EG')}</td>
                        <td className="p-2 font-mono font-semibold text-primary">{item.actualQuantity.toLocaleString('ar-EG')}</td>
                        <td className="p-2 font-mono text-destructive">{item.wastageQuantity.toLocaleString('ar-EG')}</td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelId}
        onOpenChange={(v) => !v && setCancelId(null)}
        title="إلغاء عملية التحضير والتوزيع"
        description="تنبيه: هل تريد إلغاء هذه العملية؟ لن يتم فك حجز المواد الغذائية تلقائياً من المستودع؛ يجب إلغاء الحجز يدوياً من صفحة الحجوزات لاسترجاع المواد."
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              تراجع
            </Button>
            <Button
            variant="destructive"
            onClick={() => cancelId && cancelMutation.mutate({ id: cancelId, reason: cancelReason })}
            isLoading={cancelMutation.isPending}
            disabled={!cancelReason.trim()}>
            
              تأكيد إلغاء العملية
            </Button>
          </div>
        }>
        
        <FormField label="سبب الإلغاء" required>
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="اكتب سبب إلغاء عملية التحضير..." />
          
        </FormField>
      </Dialog>

      {/* Start Preparation Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="بدء عملية تحضير وجبة"
        description="اختر الحجز المناسب للبدء في نقل المواد الغذائية من المستودع والتحضير"
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={form.formState.isSubmitting}>
              إلغاء
            </Button>
            <Button form="start-dist-form" type="submit" isLoading={form.formState.isSubmitting}>
              بدء التحضير
            </Button>
          </div>
        }>
        
        <form id="start-dist-form" onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
          <SelectField
            control={form.control}
            name="reservation"
            label="رقم حجز المخزون النشط"
            required
            placeholder="اختر الحجز"
            options={activeReservations.map((r) => ({
              value: r._id,
              label: `${r.reservationNumber} - الكتيبة الطالبة: ${r.requestingUnit || 'غير محدد'} (${r.warehouse?.name})`
            }))}
            error={form.formState.errors.reservation?.message} />
          

          <FormField label="ملاحظات التحضير والتوزيع" error={form.formState.errors.notes?.message}>
            <Input {...form.register('notes')} placeholder="مثال: تحضير فطور الكتيبة الأولى ليوم السبت..." />
          </FormField>
        </form>
      </Dialog>

      {/* Complete/Distribute Dialog */}
      <Dialog
        open={!!completeTarget}
        onOpenChange={(v) => !v && setCompleteTarget(null)}
        title="تأكيد التوزيع الفعلي وتسجيل الاستهلاك"
        description="يرجى إدخال الكميات الموزعة فعلياً وكميات الهدر الناتجة عن التحضير والتوزيع لتحديث أرصدة المستودعات بدقة"
        footer={
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCompleteTarget(null)} disabled={completeForm.formState.isSubmitting}>
              إلغاء
            </Button>
            <Button form="complete-form" type="submit" isLoading={completeForm.formState.isSubmitting}>
              حفظ وإنهاء
            </Button>
          </div>
        }>
        
        <form id="complete-form" onSubmit={completeForm.handleSubmit(onSubmitComplete)} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">عدد الوجبات المخطط</span>
              <span className="font-mono text-2xl font-bold text-foreground">
                {completeTarget?.plannedServings?.toLocaleString('ar-EG') || '0'}
              </span>
            </div>
            <div>
              <FormField 
                label="عدد الوجبات الموزعة فعلياً" 
                error={completeForm.formState.errors.actualServings?.message}
                required
              >
                <Input 
                  type="number" 
                  className="font-mono text-lg bg-background"
                  {...completeForm.register('actualServings')} 
                />
              </FormField>
            </div>
          </div>

          <FormField label="ملاحظات عامة حول التوزيع" error={completeForm.formState.errors.notes?.message}>
            <Input {...completeForm.register('notes')} placeholder="مثال: تم إكمال توزيع الحصص لجميع الأفراد بنجاح" />
          </FormField>

          <div className="space-y-3 mt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border pb-1">
              تسجيل كميات الاستهلاك والهدر لكل صنف
            </label>

            <div className="space-y-3 max-h-60 overflow-y-auto p-1">
              {completeFields.map((field, index) =>
              <div key={field.id} className="bg-secondary/25 p-3 rounded-md border border-border/60 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-foreground">{field.productName}</span>
                    <span className="font-mono text-xs text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded">
                      دفعة: {field.batchNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 items-start">
                    <div>
                      <span className="block text-[10px] text-muted-foreground font-medium mb-1">المخطط</span>
                      <span className="font-mono text-sm block h-9 leading-9 font-semibold text-primary border rounded-md px-3 bg-background flex items-center">
                        {field.plannedQuantity.toLocaleString('ar-EG')}
                      </span>
                    </div>

                    <div>
                      <FormField
                      label="المنصرف للمطبخ"
                      error={completeForm.formState.errors.items?.[index]?.issuedQuantity?.message}>
                        <Input
                        type="number"
                        step="0.01"
                        {...completeForm.register(`items.${index}.issuedQuantity`)} />
                      </FormField>
                    </div>

                    <div>
                      <FormField
                      label="المستهلك (Actual)"
                      error={completeForm.formState.errors.items?.[index]?.actualQuantity?.message}>
                        <Input
                        type="number"
                        step="0.01"
                        {...completeForm.register(`items.${index}.actualQuantity`)} />
                      </FormField>
                    </div>

                    <div>
                      <FormField
                      label="الهدر (Waste)"
                      error={completeForm.formState.errors.items?.[index]?.wastageQuantity?.message}>
                        <Input
                        type="number"
                        step="0.01"
                        {...completeForm.register(`items.${index}.wastageQuantity`)} />
                      </FormField>
                    </div>
                    
                    <div>
                      <FormField
                      label="المرتجع (Returned)"
                      error={completeForm.formState.errors.items?.[index]?.returnedQuantity?.message}>
                        <Input
                        type="number"
                        step="0.01"
                        {...completeForm.register(`items.${index}.returnedQuantity`)} />
                      </FormField>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 leading-tight mt-2 text-center bg-primary/5 p-1 rounded">
                    يجب أن يكون: المنصرف = المستهلك + الهدر + المرتجع (المرتجع سيبقى في المستودع)
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </Dialog>
    </AppLayout>);

}