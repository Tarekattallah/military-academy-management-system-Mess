import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Edit,
  History,
  Package,
  Receipt,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { 
  getPurchaseOrderById,
  updatePurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  cancelPurchaseOrder
} from '../../lib/api/purchaseOrders';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { PurchaseOrderForm } from './components/PurchaseOrderForm';

const STATUS_VARIANTS = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
  partially_received: 'info',
  fully_received: 'success',
  rejected: 'destructive',
  cancelled: 'destructive'
};

export function PurchaseOrderDetailsPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openEdit, setOpenEdit] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const canUpdate = hasPermission('purchase-orders:update');
  const canApprove = hasPermission('purchase-orders:approve');

  const { data: po, isLoading, error } = useQuery({
    queryKey: ['purchaseOrder', id],
    queryFn: () => getPurchaseOrderById(id)
  });

  const invalidateAndClose = () => {
    queryClient.invalidateQueries(['purchaseOrder', id]);
    queryClient.invalidateQueries(['purchaseOrders']);
    setOpenEdit(false);
    setOpenReject(false);
    setRejectReason('');
  };

  const updateMutation = useMutation({
    mutationFn: (data) => updatePurchaseOrder(id, data),
    onSuccess: invalidateAndClose
  });

  const submitMutation = useMutation({
    mutationFn: () => submitPurchaseOrder(id),
    onSuccess: invalidateAndClose
  });

  const approveMutation = useMutation({
    mutationFn: () => approvePurchaseOrder(id),
    onSuccess: invalidateAndClose
  });

  const rejectMutation = useMutation({
    mutationFn: (reason) => rejectPurchaseOrder(id, reason),
    onSuccess: invalidateAndClose
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchaseOrder(id),
    onSuccess: invalidateAndClose
  });

  if (isLoading) {
    return (
      <AppLayout title={t('purchaseOrders.details')}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t('purchaseOrders.messages.loading')}</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !po) {
    return (
      <AppLayout title={t('purchaseOrders.details')}>
        <div className="flex flex-col items-center justify-center h-64 text-destructive gap-4">
          <AlertCircle className="size-12" />
          <p>{t('purchaseOrders.messages.error')}</p>
          <Button variant="outline" onClick={() => navigate('/purchase-orders')}>
            عودة للقائمة
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate(rejectReason);
  };

  const itemColumns = [
    { header: t('purchaseOrders.fields.product'), accessorKey: 'product', cell: ({ row }) => row.original.product?.name || '-' },
    { header: t('purchaseOrders.fields.unit'), accessorKey: 'unit', cell: ({ row }) => row.original.unit?.name || '-' },
    { header: t('purchaseOrders.fields.quantity'), accessorKey: 'quantity', cell: ({ row }) => row.original.quantity },
    { header: t('purchaseOrders.fields.unitPrice'), accessorKey: 'unitPrice', cell: ({ row }) => row.original.unitPrice },
    { header: t('purchaseOrders.fields.subtotal'), accessorKey: 'totalPrice', cell: ({ row }) => row.original.totalPrice },
    { header: t('purchaseOrders.fields.receivedQuantity'), accessorKey: 'receivedQuantity', cell: ({ row }) => row.original.receivedQuantity },
    { header: t('purchaseOrders.fields.remainingQuantity'), accessorKey: 'remainingQuantity', cell: ({ row }) => row.original.remainingQuantity },
  ];

  // Calculate receiving progress overall if applicable
  const totalOrdered = po.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  const receivingProgress = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <AppLayout title={`${t('purchaseOrders.details')} - ${po.orderNumber}`}>
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-orders')}>
            <ArrowRight className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('purchaseOrders.details')}</h1>
          <Badge variant={STATUS_VARIANTS[po.status]} className="mr-auto px-3 py-1 text-sm">
            {t(`purchaseOrders.status.${po.status}`)}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canUpdate && po.status === 'draft' && (
            <Button onClick={() => submitMutation.mutate()} isLoading={submitMutation.isPending}>
              <Send className="size-4 ml-2" />
              {t('purchaseOrders.actions.submit')}
            </Button>
          )}

          {canApprove && po.status === 'submitted' && (
            <>
              <Button variant="success" onClick={() => approveMutation.mutate()} isLoading={approveMutation.isPending}>
                <CheckCircle2 className="size-4 ml-2" />
                {t('purchaseOrders.actions.approve')}
              </Button>
              <Button variant="destructive" onClick={() => setOpenReject(true)}>
                <XCircle className="size-4 ml-2" />
                {t('purchaseOrders.actions.reject')}
              </Button>
            </>
          )}

          {canUpdate && ['draft', 'submitted'].includes(po.status) && (
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} isLoading={cancelMutation.isPending}>
              <Ban className="size-4 ml-2" />
              {t('purchaseOrders.actions.cancel')}
            </Button>
          )}

          {canUpdate && po.status === 'approved' && totalReceived === 0 && (
            <Button variant="destructive" onClick={() => cancelMutation.mutate()} isLoading={cancelMutation.isPending}>
              <Ban className="size-4 ml-2" />
              {t('purchaseOrders.actions.cancel')}
            </Button>
          )}

          {canUpdate && po.status === 'draft' && (
            <Button variant="outline" onClick={() => setOpenEdit(true)}>
              <Edit className="size-4 ml-2" />
              {t('purchaseOrders.actions.edit')}
            </Button>
          )}
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('purchaseOrders.fields.orderNumber')}</h3>
            <p className="text-lg font-bold">{po.orderNumber}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('purchaseOrders.fields.supplier')}</h3>
            <p className="text-lg font-bold">{po.supplier?.name || '-'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('purchaseOrders.fields.warehouse')}</h3>
            <p className="text-lg font-bold">{po.warehouse?.name || '-'}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{t('purchaseOrders.fields.purchaseRequest')}</h3>
            <p className="text-lg font-bold">{po.purchaseRequest?.requestNumber || '-'}</p>
          </div>
        </div>
        
        {['partially_received', 'fully_received', 'approved'].includes(po.status) && (
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Package className="size-4" />
              ملخص الاستلام
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">الكمية المطلوبة (إجمالي)</p>
                <p className="text-lg font-semibold">{totalOrdered}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">الكمية المستلمة (إجمالي)</p>
                <p className="text-lg font-semibold text-success">{totalReceived}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">الكمية المتبقية (إجمالي)</p>
                <p className="text-lg font-semibold text-warning">{totalOrdered - totalReceived}</p>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${receivingProgress}%` }}></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-left">{receivingProgress}% مكتمل</p>
          </div>
        )}

        {/* Financial Summary */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full text-primary">
            <Receipt className="size-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{t('purchaseOrders.fields.totalPrice')}</h3>
            <p className="text-2xl font-bold">{po.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('purchaseOrders.fields.items')}</h2>
          <DataTable data={po.items} columns={itemColumns} />
        </div>

        {/* History */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <History className="size-5" />
            سجل العمليات
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('purchaseOrders.fields.createdBy')}:</span>
              <span className="font-medium">{po.createdBy?.displayName || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('purchaseOrders.fields.createdAt')}:</span>
              <span className="font-medium">{po.createdAt ? format(new Date(po.createdAt), 'dd MMM yyyy HH:mm', { locale: ar }) : '-'}</span>
            </div>
            
            {po.approvedBy && (
              <>
                <hr className="border-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('purchaseOrders.fields.approvedBy')}:</span>
                  <span className="font-medium text-success">{po.approvedBy.displayName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('purchaseOrders.fields.approvedAt')}:</span>
                  <span className="font-medium">{po.approvedAt ? format(new Date(po.approvedAt), 'dd MMM yyyy HH:mm', { locale: ar }) : '-'}</span>
                </div>
              </>
            )}

            {po.rejectedBy && (
              <>
                <hr className="border-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('purchaseOrders.fields.rejectedBy')}:</span>
                  <span className="font-medium text-destructive">{po.rejectedBy.displayName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('purchaseOrders.fields.rejectedAt')}:</span>
                  <span className="font-medium">{po.rejectedAt ? format(new Date(po.rejectedAt), 'dd MMM yyyy HH:mm', { locale: ar }) : '-'}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm mt-2 p-3 bg-destructive/10 rounded-md border border-destructive/20 text-destructive">
                  <span className="font-semibold">{t('purchaseOrders.fields.rejectionReason')}:</span>
                  <p>{po.rejectionReason}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        title={t('purchaseOrders.edit')}
      >
        <PurchaseOrderForm
          defaultValues={{
            purchaseRequest: po.purchaseRequest?._id || '',
            supplier: po.supplier?._id || '',
            warehouse: po.warehouse?._id || '',
            expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.split('T')[0] : '',
            notes: po.notes || '',
            items: po.items.map(item => ({
              product: item.product._id,
              quantity: item.quantity,
              unit: item.unit._id,
              unitPrice: item.unitPrice,
              notes: item.notes || ''
            }))
          }}
          onSubmit={(data) => updateMutation.mutate(data)}
          isSubmitting={updateMutation.isPending}
          onCancel={() => setOpenEdit(false)}
        />
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={openReject}
        onOpenChange={setOpenReject}
        title={t('purchaseOrders.actions.rejectRequest')}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setOpenReject(false)}>
              {t('purchaseOrders.actions.cancelAction')}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()} isLoading={rejectMutation.isPending}>
              {t('purchaseOrders.actions.reject')}
            </Button>
          </div>
        }
      >
        <div className="py-4 space-y-4">
          <FormField label={t('purchaseOrders.fields.rejectionReason')} required>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="أدخل سبب الرفض هنا..."
              maxLength={500}
            />
          </FormField>
        </div>
      </Dialog>
    </AppLayout>
  );
}
