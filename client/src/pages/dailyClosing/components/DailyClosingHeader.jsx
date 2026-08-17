import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Play, CheckCircle2, Lock, FileSignature, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

export function DailyClosingHeader({ closing, onOpenDay, onReconcile, onSubmit, onApprove, isOpening, isReconciling, isSubmitting, isApproving }) {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="success" className="text-sm px-3 py-1">{t('dailyClosing.status.OPEN')}</Badge>;
      case 'RECONCILING':
        return <Badge variant="warning" className="text-sm px-3 py-1">{t('dailyClosing.status.RECONCILING')}</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="info" className="text-sm px-3 py-1">{t('dailyClosing.status.PENDING_APPROVAL')}</Badge>;
      case 'CLOSED':
        return <Badge variant="destructive" className="text-sm px-3 py-1">{t('dailyClosing.status.CLOSED')}</Badge>;
      default:
        return <Badge className="text-sm px-3 py-1">{t('dailyClosing.status.OPEN')}</Badge>;
    }
  };

  const getAction = () => {
    if (!closing) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AlertCircle className="size-12 text-muted-foreground" />
          <p className="text-lg font-medium">{t('dailyClosing.messages.noDayOpened')}</p>
          <Button onClick={onOpenDay} disabled={isOpening} size="lg">
            <Play className="ml-2 size-4" />
            {t('dailyClosing.actions.open')}
          </Button>
        </div>
      );
    }

    switch (closing.status) {
      case 'OPEN':
        return (
          <Button onClick={onReconcile} disabled={isReconciling} size="lg" className="w-full sm:w-auto">
            <FileSignature className="ml-2 size-4" />
            {t('dailyClosing.actions.reconcile')}
          </Button>
        );
      case 'RECONCILING':
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onReconcile} disabled={isReconciling} variant="outline" className="w-full sm:w-auto">
              <FileSignature className="ml-2 size-4" />
              {t('dailyClosing.actions.continueReconcile')}
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
              <CheckCircle2 className="ml-2 size-4" />
              {t('dailyClosing.actions.submit')}
            </Button>
          </div>
        );
      case 'PENDING_APPROVAL':
        if (hasPermission('stock-counts:approve')) {
          return (
            <Button onClick={onApprove} disabled={isApproving} variant="destructive" size="lg" className="w-full sm:w-auto">
              <Lock className="ml-2 size-4" />
              {t('dailyClosing.actions.approve')}
            </Button>
          );
        }
        return <p className="text-muted-foreground text-sm">{t('dailyClosing.status.PENDING_APPROVAL')}</p>;
      case 'CLOSED':
        return (
          <div className="flex items-center text-destructive bg-destructive/10 px-4 py-2 rounded-md">
            <Lock className="ml-2 size-5" />
            <span className="font-medium">{t('dailyClosing.messages.closedInfo')}</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="mb-6 shadow-sm border-t-4 border-t-primary">
      <CardContent className="p-6">
        {closing ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{t('dailyClosing.title')}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">{t('dailyClosing.fields.date')}:</span>
                  <span>{new Date(closing.logicalDate).toLocaleDateString('ar-EG')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">{t('dailyClosing.fields.warehouse')}:</span>
                  <span>{closing.warehouse?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{t('dailyClosing.fields.currentStatus')}:</span>
                  {getStatusBadge(closing.status)}
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto flex justify-end">
              {getAction()}
            </div>
          </div>
        ) : (
          getAction()
        )}
      </CardContent>
    </Card>
  );
}
