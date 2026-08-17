import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { UtensilsCrossed, CalendarCheck, Activity } from 'lucide-react';

export function MealSummary({ summary = {} }) {
  const { t } = useTranslation();

  const items = [
    { label: t('dailyClosing.fields.plannedMeals'), value: summary.plannedMeals, icon: CalendarCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('dailyClosing.fields.actualMeals'), value: summary.actualMeals, icon: UtensilsCrossed, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('dailyClosing.fields.executionRate'), value: `${summary.executionRate ? summary.executionRate.toFixed(1) : 0}%`, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dailyClosing.sections.mealSummary')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
