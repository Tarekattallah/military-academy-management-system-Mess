import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle, XCircle, Send, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { LogoLoader } from '../../components/ui/LogoLoader';
import {
  getPurchaseRequestById,
  submitPurchaseRequest,
  approvePurchaseRequest,
  rejectPurchaseRequest,
  cancelPurchaseRequest
} from '../../lib/api/purchaseRequests';

const STATUS_VARIANTS = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'destructive'
};

export function PurchaseRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const canUpdate = hasPermission('purchase-requests:update');
  const canApprove = hasPermission('purchase-requests:approve');

  const { data: pr, isLoading, error } = useQuery({
    queryKey: ['purchaseRequest', id],
    queryFn: () => getPurchaseRequestById(id)
  });

  const submitMutation = useMutation({
    mutationFn: () => submitPurchaseRequest(id),
    onSuccess: () => {
      toast.success(t('purchaseRequests.messages.submitSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || t('purchaseRequests.messages.error'))
  });

  const approveMutation = useMutation({
    mutationFn: () => approvePurchaseRequest(id),
    onSuccess: () => {
      toast.success(t('purchaseRequests.messages.approveSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || t('purchaseRequests.messages.error'))
  });

  const rejectMutation = useMutation({
    mutationFn: (reason) => rejectPurchaseRequest(id, reason),
    onSuccess: () => {
      toast.success(t('purchaseRequests.messages.rejectSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      setShowRejectModal(false);
      setRejectReason('');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('purchaseRequests.messages.error'))
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPurchaseRequest(id),
    onSuccess: () => {
      toast.success(t('purchaseRequests.messages.cancelSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchaseRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      setShowCancelModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || t('purchaseRequests.messages.error'))
  });

  if (isLoading) {
    return (
      <AppLayout title={t('purchaseRequests.details')}>
        <div className="flex h-64 items-center justify-center"><LogoLoader /></div>
      </AppLayout>
    );
  }

  if (error || !pr) {
    return (
      <AppLayout title={t('purchaseRequests.details')}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-destructive mb-4">
            {error?.response?.status === 404 ? 'طلب الشراء غير موجود.' : t('purchaseRequests.messages.error')}
          </p>
          <Button onClick={() => navigate('/purchase-requests')} variant="outline">العودة للطلبات</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${t('purchaseRequests.details')} - ${pr.requestNumber}`}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/purchase-requests')}>
            <ArrowRight className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('purchaseRequests.details')}</h1>
          <Badge variant={STATUS_VARIANTS[pr.status]} className="mr-auto text-sm px-3 py-1">
            {t(`purchaseRequests.status.${pr.status}`)}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canUpdate && pr.status === 'draft' && (
            <Button
              onClick={() => submitMutation.mutate()}
              isLoading={submitMutation.isPending}
            >
              <Send className="size-4 ml-2" />
              {t('purchaseRequests.actions.submit')}
            </Button>
          )}

          {canApprove && pr.status === 'submitted' && (
            <>
              <Button
                variant="success"
                onClick={() => approveMutation.mutate()}
                isLoading={approveMutation.isPending}
              >
                <CheckCircle className="size-4 ml-2" />
                {t('purchaseRequests.actions.approve')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectModal(true)}
              >
                <XCircle className="size-4 ml-2" />
                {t('purchaseRequests.actions.reject')}
              </Button>
            </>
          )}

          {canUpdate && ['draft', 'submitted'].includes(pr.status) && (
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setShowCancelModal(true)}
            >
              <Ban className="size-4 ml-2" />
              {t('purchaseRequests.actions.cancel')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('purchaseRequests.fields.items')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-right font-medium text-muted-foreground">{t('purchaseRequests.fields.product')}</th>
                        <th className="p-3 text-right font-medium text-muted-foreground">{t('purchaseRequests.fields.quantity')}</th>
                        <th className="p-3 text-right font-medium text-muted-foreground">{t('purchaseRequests.fields.unit')}</th>
                        <th className="p-3 text-right font-medium text-muted-foreground">{t('purchaseRequests.fields.notes')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pr.items.map((item, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          <td className="p-3 font-medium">{item.product?.name || '—'}</td>
                          <td className="p-3 font-mono">{item.quantity}</td>
                          <td className="p-3">{item.unit?.name || '—'}</td>
                          <td className="p-3 text-muted-foreground max-w-[200px] truncate" title={item.notes}>{item.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {pr.rejectionReason && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <XCircle className="size-5" />
                    {t('purchaseRequests.fields.rejectionReason')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{pr.rejectionReason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.requestNumber')}</p>
                  <p className="font-mono font-medium">{pr.requestNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.warehouse')}</p>
                  <p className="font-medium">{pr.warehouse?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.requestedBy')}</p>
                  <p className="font-medium">{pr.requestedBy?.displayName || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.createdBy')}</p>
                  <p className="font-medium">{pr.createdBy?.displayName || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.createdAt')}</p>
                  <p className="font-medium" dir="ltr">{new Date(pr.createdAt).toLocaleString('ar-EG')}</p>
                </div>
              </CardContent>
            </Card>

            {(pr.approvedBy || pr.rejectedBy) && (
              <Card>
                <CardHeader>
                  <CardTitle>سجل المراجعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pr.approvedBy && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.approvedBy')}</p>
                        <p className="font-medium">{pr.approvedBy?.displayName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.approvedAt')}</p>
                        <p className="font-medium" dir="ltr">{new Date(pr.approvedAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </>
                  )}
                  {pr.rejectedBy && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.rejectedBy')}</p>
                        <p className="font-medium">{pr.rejectedBy?.displayName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('purchaseRequests.fields.rejectedAt')}</p>
                        <p className="font-medium" dir="ltr">{new Date(pr.rejectedAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        title={t('purchaseRequests.actions.rejectRequest')}
        description="الرجاء كتابة سبب رفض طلب الشراء."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={rejectMutation.isPending}>
              {t('purchaseRequests.actions.cancelAction')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate(rejectReason)}
              isLoading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              {t('purchaseRequests.actions.confirm')}
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <FormField label={t('purchaseRequests.fields.rejectionReason')} required>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              maxLength={500}
            />
          </FormField>
        </div>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        title={t('purchaseRequests.actions.cancel')}
        description={`هل أنت متأكد من إلغاء طلب الشراء ${pr?.requestNumber}؟`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={cancelMutation.isPending}>
              {t('purchaseRequests.actions.cancelAction')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              isLoading={cancelMutation.isPending}
            >
              {t('purchaseRequests.actions.confirm')}
            </Button>
          </div>
        }
      >
        {/* Empty Body */}
      </Dialog>
    </AppLayout>
  );
}
