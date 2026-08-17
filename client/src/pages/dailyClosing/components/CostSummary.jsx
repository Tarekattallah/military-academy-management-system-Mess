import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { BadgeDollarSign, Calculator, TrendingDown, Trash2, Zap } from 'lucide-react';

export function CostSummary({ summary = {} }) {
  const { t } = useTranslation();

  const formatCurrency = (val) => {
    return (val || 0).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' });
  };

  const items = [
    { label: t('dailyClosing.fields.totalStandardCost'), value: formatCurrency(summary.totalStandardCost), icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('dailyClosing.fields.totalActualCost'), value: formatCurrency(summary.totalActualCost), icon: BadgeDollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('dailyClosing.fields.varianceAmount'), value: formatCurrency(summary.varianceAmount), icon: TrendingDown, color: summary.varianceAmount > 0 ? 'text-red-500' : 'text-emerald-500', bg: summary.varianceAmount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
    { label: t('dailyClosing.fields.totalWasteCost'), value: formatCurrency(summary.totalWasteCost), icon: Trash2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('dailyClosing.fields.operationalCost'), value: formatCurrency(summary.operationalCost), icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-500/10' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dailyClosing.sections.costSummary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex flex-col border rounded-lg p-4 bg-card shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-md ${item.bg} ${item.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                </div>
                <div className="text-xl font-bold">
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
