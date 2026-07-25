import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Eye } from 'lucide-react';
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
  getReservations,
  createReservation,
  releaseReservation,
  consumeReservation,
  getMealRequests,
  getWarehouses,
} from '../../lib/api/entities';
import type { Reservation } from '../../types/reservations';
import type { MealRequest } from '../../types/mealRequests';
import type { Warehouse } from '../../types/warehouses';

const reservationFormSchema = z.object({
  mealRequest: z.string().min(1, 'طلب الوجبات مطلوب'),
  warehouse: z.string().min(1, 'المستودع مطلوب'),
  notes: z.string().trim().optional().default(''),
});

type ReservationFormSchema = z.infer<typeof reservationFormSchema>;

const emptyForm = (): ReservationFormSchema => ({
  mealRequest: '',
  warehouse: '',
  notes: '',
});

const statusLabels = {
  draft: 'مسودة',
  reserved: 'محجوز',
  released: 'محرر (ملغي)',
  consumed: 'مستهلك (منصرف)',
};

const statusVariants: Record<string, 'secondary' | 'success' | 'destructive' | 'warning'> = {
  draft: 'secondary',
  reserved: 'warning',
  released: 'destructive',
  consumed: 'success',
};

export function ReservationsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Reservation | null>(null);
  const [releaseId, setReleaseId] = useState<string | null>(null);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [consumeId, setConsumeId] = useState<string | null>(null);
  const [consumeNotes, setConsumeNotes] = useState('');

  const canCreate = hasPermission('reservations:create');
  const canRelease = hasPermission('reservations:release');
  const canConsume = hasPermission('reservations:consume');

  const { data: reservations = [], isLoading, error } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => getReservations(),
  });

  const { data: mealRequests = [] } = useQuery<MealRequest[]>({
    queryKey: ['meal-requests'],
    queryFn: () => getMealRequests(),
    enabled: open,
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
    enabled: open,
  });

  // Allowed requests to reserve for: only submitted or approved requests
  const pendingRequests = mealRequests.filter((r) => r.status === 'submitted' || r.status === 'approved');
  const activeWarehouses = warehouses.filter((w) => w.isActive);

  const createMutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setOpen(false);
      toast.success('تم إنشاء الحجز بنجاح وحجز الدفعات من المستودع');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل إنشاء الحجز (قد يكون المخزون غير كافٍ)'),
  });

  const releaseMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => releaseReservation(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setReleaseId(null);
      setReleaseNotes('');
      setViewTarget(null);
      toast.success('تم إلغاء وتحرير الحجز وإرجاع الكميات للمخزون');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل تحرير الحجز'),
  });

  const consumeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => consumeReservation(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setConsumeId(null);
      setConsumeNotes('');
      setViewTarget(null);
      toast.success('تم صرف واستهلاك الحجز بنجاح وتحديث كميات الدفعات');
    },
    onError: (err: Error) => toast.error(err.message || 'فشل استهلاك الحجز'),
  });

  const form = useForm<ReservationFormSchema>({
    resolver: zodResolver(reservationFormSchema) as any,
    defaultValues: emptyForm(),
  });

  function onSubmit(values: ReservationFormSchema) {
    createMutation.mutate(values);
  }

  function handleOpenCreate() {
    form.reset(emptyForm());
    setOpen(true);
  }

  const columns = [
    {
      accessorKey: 'reservationNumber',
      header: 'رقم الحجز',
      cell: ({ row }: { row: { original: Reservation } }) => (
        <span className="font-mono text-xs font-semibold">{row.original.reservationNumber}</span>
      ),
    },
    {
      accessorKey: 'requestingUnit',
      header: 'الجهة الطالبة',
      cell: ({ row }: { row: { original: Reservation } }) => row.original.requestingUnit || '—',
    },
    {
      accessorKey: 'warehouse',
      header: 'المستودع المحجوز منه',
      cell: ({ row }: { row: { original: Reservation } }) => row.original.warehouse?.name || '—',
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }: { row: { original: Reservation } }) => (
        <Badge variant={statusVariants[row.original.status] || 'secondary'}>
          {statusLabels[row.original.status] || row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'reservedAt',
      header: 'تاريخ الحجز',
      cell: ({ row }: { row: { original: Reservation } }) =>
        row.original.reservedAt ? new Date(row.original.reservedAt).toLocaleDateString('ar-EG') : '—',
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }: { row: { original: Reservation } }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setViewTarget(row.original)} title="عرض التفاصيل">
            <Eye className="size-4 text-muted-foreground" />
          </Button>
          {canRelease && row.original.status === 'reserved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReleaseId(row.original._id)}
              className="text-destructive border-destructive hover:bg-destructive/10"
              title="إلغاء وفك الحجز"
            >
              فك الحجز
            </Button>
          )}
          {canConsume && row.original.status === 'reserved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConsumeId(row.original._id)}
              className="text-success border-success hover:bg-success/10"
              title="صرف واستهلاك للمطبخ"
            >
              صرف
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="حجوزات المخزون للوجبات">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>قائمة الحجوزات النشطة للمطبخ العسكري</CardTitle>
          {canCreate && (
            <Button onClick={handleOpenCreate}>
              <Plus className="size-4" />
              إنشاء حجز مخزون
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
            <div className="text-center text-destructive py-8 font-medium">فشل تحميل البيانات</div>
          ) : reservations.length === 0 ? (
            <EmptyState title="لا توجد حجوزات مخزون" description="لم يتم حجز أي دفعات طعام للوجبات بعد" />
          ) : (
            <DataTable columns={columns} data={reservations} searchKey="reservationNumber" searchPlaceholder="بحث برقم الحجز..." />
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(v) => !v && setViewTarget(null)}
        title={`تفاصيل الحجز ${viewTarget?.reservationNumber || ''}`}
        description={`تاريخ الإنشاء: ${viewTarget?.reservedAt ? new Date(viewTarget.reservedAt).toLocaleDateString('ar-EG') : ''}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewTarget(null)}>
              إغلاق
            </Button>
            {canRelease && viewTarget?.status === 'reserved' && (
              <Button
                variant="destructive"
                onClick={() => setReleaseId(viewTarget._id)}
              >
                فك وإلغاء الحجز
              </Button>
            )}
            {canConsume && viewTarget?.status === 'reserved' && (
              <Button
                onClick={() => setConsumeId(viewTarget._id)}
                className="bg-success hover:bg-success/90 text-white"
              >
                تأكيد صرف واستهلاك المواد
              </Button>
            )}
          </div>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm border-b border-border pb-4">
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">طلب الوجبة المرتبط</span>
                <span className="font-semibold text-foreground">{viewTarget.mealRequest?.requestNumber}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">المستودع</span>
                <span className="font-semibold text-foreground">{viewTarget.warehouse?.name}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">حالة الحجز</span>
                <Badge variant={statusVariants[viewTarget.status] || 'secondary'}>
                  {statusLabels[viewTarget.status] || viewTarget.status}
                </Badge>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-medium mb-0.5">الجهة المستفيدة</span>
                <span className="font-semibold text-foreground">{viewTarget.requestingUnit || '—'}</span>
              </div>
              {viewTarget.notes && (
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground font-medium mb-0.5">ملاحظات</span>
                  <p className="text-foreground bg-secondary/35 p-2 rounded-md">{viewTarget.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-2">المواد الغذائية المحجوزة من المخزون</h3>
              <div className="border border-border rounded-md divide-y divide-border overflow-x-auto">
                <table className="w-full text-sm text-right text-foreground">
                  <thead className="bg-secondary/40 text-xs text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-2">المنتج</th>
                      <th className="p-2">رقم الدفعة</th>
                      <th className="p-2">الكمية المحجوزة</th>
                      <th className="p-2">المستهلكة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewTarget.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2 font-medium">{item.product?.name}</td>
                        <td className="p-2 font-mono text-xs">{item.batch?.batchNumber}</td>
                        <td className="p-2 font-mono font-semibold text-primary">{item.reservedQuantity.toLocaleString('ar-EG')}</td>
                        <td className="p-2 font-mono text-muted-foreground">{item.consumedQuantity.toLocaleString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Release Confirmation Dialog */}
      <Dialog
        open={!!releaseId}
        onOpenChange={(v) => !v && setReleaseId(null)}
        title="فك وإلغاء حجز المواد"
        description="هل أنت متأكد من إلغاء هذا الحجز؟ سيتم إرجاع كافة الكميات المحجوزة وصلاحيتها للمستودع فوراً."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReleaseId(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => releaseId && releaseMutation.mutate({ id: releaseId, notes: releaseNotes })}
              isLoading={releaseMutation.isPending}
            >
              تأكيد إلغاء الحجز
            </Button>
          </div>
        }
      >
        <FormField label="ملاحظات الإلغاء">
          <Input
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
            placeholder="اكتب سبب إلغاء الحجز..."
          />
        </FormField>
      </Dialog>

      {/* Consume Confirmation Dialog */}
      <Dialog
        open={!!consumeId}
        onOpenChange={(v) => !v && setConsumeId(null)}
        title="صرف واستهلاك الحجز للمطبخ"
        description="تأكيد صرف المواد الغذائية المحجوزة فعلياً للمطبخ للبدء في تحضير الطعام."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConsumeId(null)}>
              إلغاء
            </Button>
            <Button
              onClick={() => consumeId && consumeMutation.mutate({ id: consumeId, notes: consumeNotes })}
              isLoading={consumeMutation.isPending}
              className="bg-success hover:bg-success/90 text-white"
            >
              تأكيد الصرف
            </Button>
          </div>
        }
      >
        <FormField label="ملاحظات الصرف">
          <Input
            value={consumeNotes}
            onChange={(e) => setConsumeNotes(e.target.value)}
            placeholder="مثال: تم صرف كامل الكميات للمطبخ الرئيسي..."
          />
        </FormField>
      </Dialog>

      {/* Create Dialog */}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="إنشاء حجز مخزون جديد"
        description="ربط طلب الوجبة المعتمد بالمستودع المناسب لحجز الدفعات تلقائياً"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={form.formState.isSubmitting}>
              إلغاء
            </Button>
            <Button form="reservation-form" type="submit" isLoading={form.formState.isSubmitting}>
              حجز الكميات
            </Button>
          </div>
        }
      >
        <form id="reservation-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <SelectField
            control={form.control}
            name="mealRequest"
            label="طلب التموين / الوجبة المعتمد"
            required
            placeholder="اختر طلب التموين المعلق"
            options={pendingRequests.map((r) => ({
              value: r._id,
              label: `${r.requestNumber} - ${r.requestingUnit} (${r.notes || 'بدون ملاحظات'})`,
            }))}
            error={form.formState.errors.mealRequest?.message}
          />

          <SelectField
            control={form.control}
            name="warehouse"
            label="المستودع المطلوب الحجز منه"
            required
            placeholder="اختر المستودع"
            options={activeWarehouses.map((w) => ({
              value: w._id,
              label: w.name,
            }))}
            error={form.formState.errors.warehouse?.message}
          />

          <FormField label="ملاحظات الحجز" error={form.formState.errors.notes?.message}>
            <Input {...form.register('notes')} placeholder="أي ملاحظات تخص صرف هذا الحجز" />
          </FormField>
        </form>
      </Dialog>
    </AppLayout>
  );
}
