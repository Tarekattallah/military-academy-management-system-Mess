import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { CheckCircle2, XCircle } from 'lucide-react';

export function ReconciliationSummary({ closing }) {
  const { t } = useTranslation();

  if (!closing) return null;

  const hasPassed = ['RECONCILING', 'PENDING_APPROVAL', 'CLOSED'].includes(closing.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dailyClosing.sections.reconciliation')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          {hasPassed ? (
            <div className="bg-success/20 p-2 rounded-full">
              <CheckCircle2 className="size-6 text-success" />
            </div>
          ) : (
            <div className="bg-muted p-2 rounded-full">
              <XCircle className="size-6 text-muted-foreground" />
            </div>
          )}
          
          <div>
            <h4 className="font-medium">
              {hasPassed ? t('dailyClosing.status.RECONCILING') + ' - مطابقة' : 'بانتظار التسوية'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {hasPassed 
                ? 'تم التأكد من صحة الرصيد الفعلي مقابل المتوقع واكتمال جميع العمليات.' 
                : 'يجب التحقق من المخزون والعمليات قبل بدء التسوية.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
