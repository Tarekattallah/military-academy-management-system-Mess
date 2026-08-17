import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { PackagePlus, ArrowLeftRight, Undo2, Trash2, ArrowDownUp, PackageMinus } from 'lucide-react';

export function InventorySummary({ summary = {} }) {
  const { t } = useTranslation();

  const items = [
    { label: t('dailyClosing.fields.totalReceiving'), value: summary.totalReceiving, icon: PackagePlus, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('dailyClosing.fields.totalIssue'), value: summary.totalIssue, icon: PackageMinus, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: t('dailyClosing.fields.totalTransferIn'), value: summary.totalTransferIn, icon: ArrowLeftRight, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: t('dailyClosing.fields.totalTransferOut'), value: summary.totalTransferOut, icon: ArrowLeftRight, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: t('dailyClosing.fields.totalReturn'), value: summary.totalReturn, icon: Undo2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('dailyClosing.fields.totalWaste'), value: summary.totalWaste, icon: Trash2, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: t('dailyClosing.fields.totalAdjustment'), value: summary.totalAdjustment, icon: ArrowDownUp, color: 'text-slate-500', bg: 'bg-slate-500/10' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dailyClosing.sections.inventorySummary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <div className="text-2xl font-bold">
                  {item.value || 0}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
