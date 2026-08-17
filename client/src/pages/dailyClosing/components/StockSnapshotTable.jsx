import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

export function StockSnapshotTable({ title, snapshot = [] }) {
  const { t } = useTranslation();

  if (!snapshot || snapshot.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-4 text-center">لا توجد بيانات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">{t('dailyClosing.fields.product')}</th>
              <th className="px-4 py-2 font-medium">{t('dailyClosing.fields.batch')}</th>
              <th className="px-4 py-2 font-medium">{t('dailyClosing.fields.unit')}</th>
              <th className="px-4 py-2 font-medium">{t('dailyClosing.fields.quantity')}</th>
              <th className="px-4 py-2 font-medium">{t('dailyClosing.fields.value')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {snapshot.map((item, idx) => (
              <tr key={idx} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-2">{item.product?.name || item.product}</td>
                <td className="px-4 py-2">{item.batch?.batchNumber || item.batch}</td>
                <td className="px-4 py-2">{item.unit?.name || item.unit}</td>
                <td className="px-4 py-2 font-semibold">{item.quantity}</td>
                <td className="px-4 py-2">
                  {item.totalValue ? item.totalValue.toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' }) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
