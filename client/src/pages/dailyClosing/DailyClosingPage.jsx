import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { LogoLoader } from '../../components/ui/LogoLoader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';

import { DailyClosingHeader } from './components/DailyClosingHeader';
import { StockSnapshotTable } from './components/StockSnapshotTable';
import { InventorySummary } from './components/InventorySummary';
import { MealSummary } from './components/MealSummary';
import { CostSummary } from './components/CostSummary';
import { ReconciliationSummary } from './components/ReconciliationSummary';

import {
  getWarehouses,
  getClosings,
  openDay,
  startReconciliation,
  submitClosing,
  approveClosing
} from '../../lib/api/entities';

export function DailyClosingPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  
  // Dialog states
  const [confirmOpenDialog, setConfirmOpenDialog] = useState(false);
  const [confirmSubmitDialog, setConfirmSubmitDialog] = useState(false);
  const [confirmApproveDialog, setConfirmApproveDialog] = useState(false);

  // Fetch warehouses
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses
  });

  // Automatically select the first warehouse if none is selected
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouse) {
      setSelectedWarehouse(warehouses[0]._id);
    }
  }, [warehouses, selectedWarehouse]);

  // Fetch latest closing for selected warehouse
  const { data: closingsData, isLoading: isLoadingClosings, error } = useQuery({
    queryKey: ['dailyClosings', selectedWarehouse],
    queryFn: () => getClosings({ warehouse: selectedWarehouse, sort: '-logicalDate', limit: 1 }),
    enabled: !!selectedWarehouse,
    retry: false
  });

  const latestClosing = closingsData?.data?.[0] || null;

  const handleError = (err) => {
    if (err?.response?.status === 403) {
      toast.error(t('dailyClosing.messages.frozenError'));
    } else {
      toast.error(err.response?.data?.message || err.message || 'حدث خطأ');
    }
  };

  const openMutation = useMutation({
    mutationFn: (payload) => openDay(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyClosings'] });
      setConfirmOpenDialog(false);
      toast.success(t('dailyClosing.title') + ' - ' + t('dailyClosing.actions.open') + ' بنجاح');
    },
    onError: handleError
  });

  const reconcileMutation = useMutation({
    mutationFn: (id) => startReconciliation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyClosings'] });
      toast.success('تم التسوية بنجاح');
    },
    onError: handleError
  });

  const submitMutation = useMutation({
    mutationFn: (id) => submitClosing(id, { notes: 'Submitting closing' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyClosings'] });
      setConfirmSubmitDialog(false);
      toast.success('تم الإرسال للاعتماد بنجاح');
    },
    onError: handleError
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveClosing(id, { notes: 'Approving closing' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyClosings'] });
      setConfirmApproveDialog(false);
      toast.success('تم الاعتماد والإغلاق بنجاح');
    },
    onError: handleError
  });

  const handleOpenDay = () => {
    const logicalDate = new Date().toISOString().split('T')[0];
    openMutation.mutate({ warehouse: selectedWarehouse, logicalDate });
  };

  const handleReconcile = () => {
    if (latestClosing) reconcileMutation.mutate(latestClosing._id);
  };

  const handleSubmit = () => {
    if (latestClosing) submitMutation.mutate(latestClosing._id);
  };

  const handleApprove = () => {
    if (latestClosing) approveMutation.mutate(latestClosing._id);
  };

  if (isLoadingWarehouses) return <LogoLoader />;

  return (
    <AppLayout title={t('dailyClosing.title')}>
      <div className="mb-6 max-w-sm flex flex-col gap-2">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('dailyClosing.fields.warehouse')}
        </label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-full bg-card shadow-sm border-input">
            <SelectValue placeholder={t('dailyClosing.fields.warehouse')} />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((w) => (
              <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoadingClosings ? (
        <LogoLoader />
      ) : (
        <>
          <DailyClosingHeader 
            closing={latestClosing} 
            onOpenDay={() => setConfirmOpenDialog(true)}
            onReconcile={handleReconcile}
            onSubmit={() => setConfirmSubmitDialog(true)}
            onApprove={() => setConfirmApproveDialog(true)}
            isOpening={openMutation.isPending}
            isReconciling={reconcileMutation.isPending}
            isSubmitting={submitMutation.isPending}
            isApproving={approveMutation.isPending}
          />

          {latestClosing && (
            <div className="space-y-6">
              <ReconciliationSummary closing={latestClosing} />
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <StockSnapshotTable 
                  title={t('dailyClosing.sections.openingStock')} 
                  snapshot={latestClosing.openingStockSnapshot} 
                />
                {['RECONCILING', 'PENDING_APPROVAL', 'CLOSED'].includes(latestClosing.status) && (
                  <StockSnapshotTable 
                    title={t('dailyClosing.sections.closingStock')} 
                    snapshot={latestClosing.closingStockSnapshot} 
                  />
                )}
              </div>

              <InventorySummary summary={latestClosing.inventorySummary} />
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <MealSummary summary={latestClosing.mealSummary} />
                <CostSummary summary={latestClosing.costSummary} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialogs */}
      <Dialog 
        open={confirmOpenDialog} 
        onClose={() => setConfirmOpenDialog(false)}
        title={t('dailyClosing.messages.openDayConfirm')}
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setConfirmOpenDialog(false)}>إلغاء</Button>
          <Button onClick={handleOpenDay} disabled={openMutation.isPending}>تأكيد الفتح</Button>
        </div>
      </Dialog>

      <Dialog 
        open={confirmSubmitDialog} 
        onClose={() => setConfirmSubmitDialog(false)}
        title="تأكيد إرسال اليومية"
      >
        <p className="mb-6">{t('dailyClosing.messages.submitConfirm')}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmSubmitDialog(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={submitMutation.isPending}>تأكيد الإرسال</Button>
        </div>
      </Dialog>

      <Dialog 
        open={confirmApproveDialog} 
        onClose={() => setConfirmApproveDialog(false)}
        title="تأكيد الاعتماد"
      >
        <p className="mb-6 text-destructive font-medium">{t('dailyClosing.messages.approveConfirm')}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmApproveDialog(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={handleApprove} disabled={approveMutation.isPending}>اعتماد وإغلاق</Button>
        </div>
      </Dialog>

    </AppLayout>
  );
}
