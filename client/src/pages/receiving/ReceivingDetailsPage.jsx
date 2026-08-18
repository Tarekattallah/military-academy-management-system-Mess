import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ArrowRight, 
  Ban, 
  Package,
  History,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { 
  getReceivingById,
  cancelReceiving
} from '../../lib/api/receiving';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';

const STATUS_VARIANTS = {
  draft: 'secondary',
  completed: 'success',
  cancelled: 'destructive'
};

export function ReceivingDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openCancel, setOpenCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // NOTE: Based on backend API, only receiving:delete can cancel a receiving document.
  const canDelete = hasPermission('receiving:delete');

  const { data: receiving, isLoading, error } = useQuery({
    queryKey: ['receiving', id],
    queryFn: () => getReceivingById(id)
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => cancelReceiving(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['receiving', id]);
      queryClient.invalidateQueries(['receivings']);
      queryClient.invalidateQueries(['purchaseOrders']);
      setOpenCancel(false);
      setCancelReason('');
    }
  });

  if (isLoading) {
    return (
      <AppLayout title={t('receiving.details')}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('receiving.messages.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !receiving) {
    return (
      <AppLayout title={t('receiving.details')}>
        <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
          <AlertCircle className="size-12" />
          <p>{t('receiving.messages.error')}</p>
          <Button variant="outline" onClick={() => navigate('/receiving')}>
            عودة للقائمة
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleCancel = () => {
    cancelMutation.mutate(cancelReason.trim() || undefined);
  };

  const itemColumns = [
    { header: t('receiving.fields.product'), accessorKey: 'product', cell: ({ row }) => row.original.product?.name || '-' },
    { header: t('receiving.fields.batchNumber'), accessorKey: 'batchNumber', cell: ({ row }) => <span className="font-mono">{row.original.batchNumber}</span> },
    { header: t('receiving.fields.receivingQuantity'), accessorKey: 'quantity', cell: ({ row }) => <span className="font-medium text-success">{row.original.quantity}</span> },
    { header: t('receiving.fields.unitCost'), accessorKey: 'unitCost', cell: ({ row }) => row.original.unitCost ? row.original.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-' },
    { header: t('receiving.fields.manufacturingDate'), accessorKey: 'manufacturingDate', cell: ({ row }) => row.original.manufacturingDate ? format(new Date(row.original.manufacturingDate), 'dd MMM yyyy', { locale: ar }) : '-' },
    { header: t('receiving.fields.expiryDate'), accessorKey: 'expiryDate', cell: ({ row }) => row.original.expiryDate ? format(new Date(row.original.expiryDate), 'dd MMM yyyy', { locale: ar }) : '-' },
  ];

  return (
    <AppLayout title={`${t('receiving.details')} - ${receiving.receivingNumber}`}>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/receiving')}>
            <ArrowRight className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('receiving.details')}</h1>
          <Badge variant={STATUS_VARIANTS[receiving.status]} className="mr-auto px-3 py-1 text-sm">
            {t(`receiving.status.${receiving.status}`)}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canDelete && receiving.status === 'completed' && (
            <Button variant="destructive" onClick={() => setOpenCancel(true)}>
              <Ban className="size-4 ml-2" />
              {t('receiving.actions.cancelReceiving')}
            </Button>
          )}
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('receiving.fields.receivingNumber')}</h3>
            <p className="text-lg font-bold">{receiving.receivingNumber}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('receiving.fields.purchaseOrder')}</h3>
            <p className="text-lg font-bold">{receiving.purchaseOrder?.orderNumber || '-'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('receiving.fields.supplier')}</h3>
            <p className="text-lg font-bold">{receiving.supplier?.name || '-'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('receiving.fields.warehouse')}</h3>
            <p className="text-lg font-bold">{receiving.warehouse?.name || '-'}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="size-5" />
            {t('receiving.fields.items')}
          </h2>
          <DataTable data={receiving.items} columns={itemColumns} />
        </div>

        {/* Notes */}
        {receiving.notes && (
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('receiving.fields.notes')}</h3>
            <p className="text-sm">{receiving.notes}</p>
          </div>
        )}

        {/* History */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="size-5" />
            سجل العمليات
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('receiving.fields.createdBy')}:</span>
              <span className="font-medium">{receiving.createdBy?.displayName || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('receiving.fields.receivingDate')}:</span>
              <span className="font-medium">{receiving.receivingDate ? format(new Date(receiving.receivingDate), 'dd MMM yyyy HH:mm', { locale: ar }) : '-'}</span>
            </div>

            {receiving.status === 'cancelled' && (
              <>
                <hr className="border-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">حالة الإلغاء:</span>
                  <span className="font-medium text-destructive">تم الإلغاء</span>
                </div>
                {receiving.notes && (
                  <div className="flex flex-col gap-1 text-sm mt-2 p-3 bg-destructive/10 rounded-md border border-destructive/20 text-destructive">
                    <span className="font-semibold">{t('receiving.fields.cancelReason')}:</span>
                    <p>{receiving.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog
        open={openCancel}
        onOpenChange={setOpenCancel}
        title={t('receiving.actions.cancelReceiving')}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setOpenCancel(false)} disabled={cancelMutation.isPending}>
              {t('receiving.actions.cancelAction')}
            </Button>
            <Button variant="destructive" onClick={handleCancel} isLoading={cancelMutation.isPending}>
              {t('receiving.actions.confirmCancel')}
            </Button>
          </div>
        }
      >
        <div className="py-4 space-y-4">
          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
            <p className="font-semibold mb-1">تحذير: إجراء لا يمكن التراجع عنه</p>
            <p>سيؤدي إلغاء الاستلام إلى:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>إنقاص الكميات من الدُفعات المرتبطة</li>
              <li>تسجيل حركة مخزنية عكسية (إلغاء)</li>
              <li>تحديث حالة أمر الشراء المرتبط</li>
              <li>تغيير حالة الاستلام إلى "ملغي"</li>
            </ul>
          </div>
          
          <FormField label={`${t('receiving.fields.cancelReason')} (اختياري)`}>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="أدخل سبب الإلغاء..."
              maxLength={500}
            />
          </FormField>
        </div>
      </Dialog>
    </AppLayout>
  );
}
