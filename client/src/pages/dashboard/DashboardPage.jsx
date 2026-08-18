import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  getDashboardSummary,
  getDashboardInventory,
  getDashboardToday,
  getDashboardConsumption,
  getDashboardWaste,
  getDashboardReservations,
  getDashboardDistributions,
  getDashboardWarehouses,
  getDashboardCost,
  getWarehouses,
  getClosings } from
'../../lib/api/entities';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  Trash2,
  ClipboardCheck,
  ArrowDownUp,
  PackageCheck,
  Warehouse,
  Truck,
  ChefHat,
  BookOpen,
  CalendarCheck,
  BadgeDollarSign,
  Layers,
  Clock,
  PackagePlus,
  Undo2,
  UtensilsCrossed,
  BarChart3,
  ShoppingCart,
  PieChart,
  TrendingUp,
  Activity,
  Store } from
'lucide-react';

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'default'





}) {
  const iconBgMap = {
    default: 'bg-accent text-accent-foreground',
    warning: 'bg-warning/15 text-warning-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-success/15 text-success-foreground'
  };

  const valueColorMap = {
    default: 'text-foreground',
    warning: 'text-warning-foreground',
    destructive: 'text-destructive',
    success: 'text-success-foreground'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`rounded-md p-2 ${iconBgMap[tone]}`}>
            <Icon className="size-4" />
          </div>
          <CardTitle>{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-xl font-semibold tabular-nums ${valueColorMap[tone]}`}>
          {typeof value === 'number' ? value.toLocaleString('ar-EG') : value}
        </p>
      </CardContent>
    </Card>);

}

function SectionCard({
  title,
  icon: Icon,
  children
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-accent p-2 text-accent-foreground">
            <Icon className="size-4" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) =>
        <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>);
}

function ErrorCard({ message }) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center">
      <p className="text-destructive">{message}</p>
    </div>);

}

// ── Daily Closing Status Card ──────────────────────────────────────────

function DailyClosingStatusCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses
  });

  const selectedWarehouse = warehouses.length > 0 ? warehouses[0]._id : null;

  const { data: closingsData } = useQuery({
    queryKey: ['dailyClosings', selectedWarehouse],
    queryFn: () => getClosings({ warehouse: selectedWarehouse, sort: '-logicalDate', limit: 1 }),
    enabled: !!selectedWarehouse
  });

  const closing = closingsData?.data?.[0];

  if (!closing) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN': return <Badge variant="success">{t('dailyClosing.status.OPEN')}</Badge>;
      case 'RECONCILING': return <Badge variant="warning">{t('dailyClosing.status.RECONCILING')}</Badge>;
      case 'PENDING_APPROVAL': return <Badge variant="info">{t('dailyClosing.status.PENDING_APPROVAL')}</Badge>;
      case 'CLOSED': return <Badge variant="destructive">{t('dailyClosing.status.CLOSED')}</Badge>;
      default: return null;
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Store className="size-6" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{t('dashboard.dailyClosingStatus')}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{closing.logicalDate ? new Date(closing.logicalDate).toLocaleDateString('ar-EG') : '-'}</span>
            <span>•</span>
            <span>{closing.warehouse?.name}</span>
            <span>•</span>
            {getStatusBadge(closing.status)}
          </div>
        </div>
      </div>
      <Button onClick={() => navigate('/daily-closing')} variant={closing.status === 'OPEN' ? 'default' : 'outline'}>
        {closing.status === 'OPEN' ? t('dailyClosing.actions.reconcile') : 'عرض اليومية'}
      </Button>
    </div>
  );
}

// ── Analysis Section ──────────────────────────────────────────────────

function AnalysisSection() {
  const { t } = useTranslation();
  const { data: summary } = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary });
  const { data: inventory } = useQuery({ queryKey: ['dashboard', 'inventory'], queryFn: getDashboardInventory });
  const { data: waste } = useQuery({ queryKey: ['dashboard', 'waste'], queryFn: getDashboardWaste });
  const { data: consumption } = useQuery({ queryKey: ['dashboard', 'consumption'], queryFn: getDashboardConsumption });
  const { data: costAnalytics } = useQuery({ queryKey: ['dashboard', 'cost'], queryFn: getDashboardCost });

  if (!summary || !inventory || !waste || !consumption || !costAnalytics) return <LoadingSkeleton />;

  const consumeMonth = consumption.totalConsumptionThisMonth?.totalCost || 0;
  const wasteMonth = waste.totalWasteThisMonth || 0;
  
  const wasteRatio = consumeMonth > 0 ? ((wasteMonth / consumeMonth) * 100).toFixed(1) : 0;
  const activeStock = inventory.totalBatchCount - (inventory.outOfStockCount + inventory.expiredBatchCount);
  const stockHealth = inventory.totalBatchCount > 0 ? ((activeStock / inventory.totalBatchCount) * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110">
          <Activity className="size-24 text-indigo-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{t('dashboard.stockHealth')}</p>
            <h3 className="text-3xl font-bold text-indigo-600">{stockHealth}%</h3>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="size-3" /> {t('dashboard.healthDesc')}
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110">
          <TrendingUp className="size-24 text-emerald-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{t('dashboard.efficiency')}</p>
            <h3 className="text-3xl font-bold text-emerald-600">{consumeMonth > 0 ? t('dashboard.efficiencyIdeal') : t('dashboard.efficiencyAvg')}</h3>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <PieChart className="size-3" /> {t('dashboard.efficiencyDesc')}
          </div>
        </div>
      </div>

      <div className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110">
          <PieChart className="size-24 text-rose-500" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{t('dashboard.wasteRatio')}</p>
            <h3 className="text-3xl font-bold text-rose-600">{wasteRatio}%</h3>
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="size-3" /> {t('dashboard.wasteDesc')}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Summary Section ──────────────────────────────────────────────────

function SummarySection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل ملخص لوحة التحكم" />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={Boxes} label="إجمالي المنتجات" value={data.totalProducts} />
      <KpiCard icon={Warehouse} label="المستودعات" value={data.totalWarehouses} />
      <KpiCard icon={Truck} label="الموردين" value={data.totalSuppliers} />
      <KpiCard icon={BadgeDollarSign} label="قيمة المخزون" value={`${data.totalInventoryValue.toLocaleString('ar-EG')} ر.س`} tone="success" />
      <KpiCard icon={ChefHat} label="الوصفات" value={data.totalRecipes} />
      <KpiCard icon={BookOpen} label="قوائم الطعام" value={data.totalMenus} />
      <KpiCard icon={CalendarCheck} label="الحجوزات" value={data.totalReservations} />
      <KpiCard icon={UtensilsCrossed} label="التوزيعات" value={data.totalMealDistributions} />
    </div>);

}

// ── Inventory Section ────────────────────────────────────────────────

function InventorySection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    queryFn: getDashboardInventory
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات المخزون" />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard icon={Layers} label="إجمالي الدفعات" value={data.totalBatchCount} />
      <KpiCard icon={AlertTriangle} label="مخزون منخفض" value={data.lowStockCount} tone="warning" />
      <KpiCard icon={Boxes} label="نفد من المخزون" value={data.outOfStockCount} tone="destructive" />
      <KpiCard icon={Trash2} label="منتهي الصلاحية" value={data.expiredBatchCount} tone="destructive" />
      <KpiCard icon={Clock} label="ينتهي قريباً" value={data.nearExpiryBatchCount} tone="warning" />
    </div>);

}

// ── Today's Operations Section ───────────────────────────────────────

function TodaySection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: getDashboardToday
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل عمليات اليوم" />;

  const hasData = data.receivingsToday > 0 || data.transfersToday > 0 || data.wasteRecordsToday > 0 || data.reservationsToday > 0 || data.mealDistributionsToday > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="لا توجد عمليات اليوم"
        description="لم يتم تسجيل أي عمليات حتى الآن" />);


  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard icon={PackagePlus} label="استلام" value={data.receivingsToday} tone="success" />
      <KpiCard icon={ArrowDownUp} label="تحويلات" value={data.transfersToday} />
      <KpiCard icon={Undo2} label="مرتجعات" value={data.returnsToday || 0} />
      <KpiCard icon={Trash2} label="هالك" value={data.wasteRecordsToday} tone="destructive" />
      <KpiCard icon={UtensilsCrossed} label="توزيعات" value={data.mealDistributionsToday} tone="success" />
    </div>);

}

// ── Meals Overview Section (Mess Officer Specific) ───────────────────

function MealsOverviewSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: getDashboardToday
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل عمليات الوجبات" />;

  const planned = data.plannedMealsToday || 0;
  const distributed = data.distributedMealsToday || 0;
  const executionRate = planned > 0 ? Math.round((distributed / planned) * 100) : 0;
  const diff = distributed - planned;
  
  const diffTone = diff === 0 ? 'success' : (Math.abs(diff) > (planned * 0.1) ? 'destructive' : 'warning');
  const diffLabel = diff === 0 ? 'مطابق تماماً' : (diff > 0 ? `زيادة بمقدار ${diff}` : `نقص بمقدار ${Math.abs(diff)}`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={BookOpen} label="الوجبات المخططة" value={planned} />
        <KpiCard icon={UtensilsCrossed} label="الوجبات الموزعة فعلياً" value={distributed} tone={executionRate >= 95 ? 'success' : 'warning'} />
        <KpiCard icon={Activity} label="نسبة التنفيذ" value={`${executionRate}%`} tone={executionRate >= 95 ? 'success' : (executionRate < 80 ? 'destructive' : 'warning')} />
      </div>
      
      <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-foreground">تحليل التخطيط مقابل الفعلي (Planned vs Actual)</h4>
          <p className="text-sm text-muted-foreground mt-1">يعكس هذا المؤشر دقة التخطيط بناءً على طلبات الإعاشة مقابل الصرف الفعلي.</p>
        </div>
        <Badge variant={diffTone} className="text-sm px-3 py-1">
           {diffLabel}
        </Badge>
      </div>
    </div>
  );
}

// ── Movement Summary Section ─────────────────────────────────────────

function MovementSummarySection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: getDashboardToday
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل حركات المخزون" />;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <KpiCard icon={PackagePlus} label="استلام (Receiving)" value={data.receivingsToday} tone="success" />
      <KpiCard icon={UtensilsCrossed} label="صرف (Issue)" value={data.mealDistributionsToday} tone="success" />
      <KpiCard icon={ArrowDownUp} label="تحويل (Transfer)" value={data.transfersToday} />
      <KpiCard icon={Undo2} label="مرتجع (Return)" value={data.returnsToday || 0} />
      <KpiCard icon={Trash2} label="هالك (Waste)" value={data.wasteRecordsToday} tone="destructive" />
      <KpiCard icon={CalendarCheck} label="حجز (Reserve)" value={data.reservationsToday} />
    </div>
  );
}

// ── Consumption Section ──────────────────────────────────────────────

function ConsumptionSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'consumption'],
    queryFn: getDashboardConsumption
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات الاستهلاك" />;

  const today = data.totalConsumptionToday;
  const month = data.totalConsumptionThisMonth;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={ShoppingCart} label="استهلاك اليوم (كمية)" value={today.totalQuantity} tone="success" />
        <KpiCard icon={BadgeDollarSign} label="استهلاك اليوم (تكلفة)" value={`${today.totalCost.toLocaleString('ar-EG')} ر.س`} />
        <KpiCard icon={BarChart3} label="استهلاك الشهر (كمية)" value={month.totalQuantity} />
        <KpiCard icon={BadgeDollarSign} label="استهلاك الشهر (تكلفة)" value={`${month.totalCost.toLocaleString('ar-EG')} ر.س`} tone="warning" />
      </div>

      {data.topConsumedProducts.length > 0 &&
      <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">أكثر المنتجات استهلاكاً</h4>
          <DataTable
          columns={[
          { accessorKey: 'productName', header: 'المنتج' },
          { accessorKey: 'productSku', header: 'SKU' },
          { accessorKey: 'totalConsumed', header: 'الكمية المستهلكة' },
          {
            accessorKey: 'totalCost',
            header: 'التكلفة',
            cell: ({ row }) =>
            `${row.original.totalCost.toLocaleString('ar-EG')} ر.س`
          }]
          }
          data={data.topConsumedProducts}
          searchKey="productName"
          searchPlaceholder="بحث..." />
        
        </div>
      }

      {data.topRecipes.length > 0 &&
      <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">أكثر الوصفات توزيعاً</h4>
          <DataTable
          columns={[
          { accessorKey: 'recipeName', header: 'الوصفة' },
          { accessorKey: 'recipeNumber', header: 'رقم الوصفة' },
          { accessorKey: 'totalDistributed', header: 'مرات التوزيع' },
          { accessorKey: 'totalIngredientsUsed', header: 'المكونات المستخدمة' }]
          }
          data={data.topRecipes}
          searchKey="recipeName"
          searchPlaceholder="بحث..." />
        
        </div>
      }
    </div>);

}

// ── Waste Section ────────────────────────────────────────────────────

function WasteSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'waste'],
    queryFn: getDashboardWaste
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات الهالك" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard icon={Trash2} label="هالك اليوم" value={data.totalWasteToday} tone="destructive" />
        <KpiCard icon={Trash2} label="هالك الشهر" value={data.totalWasteThisMonth} tone="warning" />
      </div>

      {data.topWastedProducts.length > 0 &&
      <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">أكثر المنتجات هالكاً</h4>
          <DataTable
          columns={[
          { accessorKey: 'productName', header: 'المنتج' },
          { accessorKey: 'totalQuantity', header: 'الكمية' }]
          }
          data={data.topWastedProducts}
          searchKey="productName"
          searchPlaceholder="بحث..." />
        
        </div>
      }
    </div>);

}

// ── Reservation Section ──────────────────────────────────────────────

function ReservationSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'reservations'],
    queryFn: getDashboardReservations
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات الحجوزات" />;

  const hasData = Object.values(data).some((v) => v > 0);

  if (!hasData) {
    return (
      <EmptyState
        title="لا توجد حجوزات"
        description="لم يتم تسجيل أي حجوزات بعد" />);


  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard icon={CalendarCheck} label="مسودة" value={data.draft} />
      <KpiCard icon={CalendarCheck} label="محجوز" value={data.reserved} tone="success" />
      <KpiCard icon={ClipboardCheck} label="مستهلك" value={data.consumed} tone="success" />
      <KpiCard icon={Undo2} label="ملغي" value={data.cancelled} tone="destructive" />
      <KpiCard icon={Undo2} label="محرر" value={data.released} tone="warning" />
    </div>);

}

// ── Distribution Section ─────────────────────────────────────────────

function DistributionSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'distributions'],
    queryFn: getDashboardDistributions
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات التوزيعات" />;

  const hasData = Object.values(data).some((v) => v > 0);

  if (!hasData) {
    return (
      <EmptyState
        title="لا توجد توزيعات"
        description="لم يتم تسجيل أي توزيعات بعد" />);


  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={ClipboardCheck} label="مسودة" value={data.draft} />
      <KpiCard icon={ArrowDownUp} label="قيد التنفيذ" value={data.inProgress} tone="warning" />
      <KpiCard icon={PackageCheck} label="مكتمل" value={data.completed} tone="success" />
      <KpiCard icon={Undo2} label="ملغي" value={data.cancelled} tone="destructive" />
    </div>);

}

// ── Warehouse Section ────────────────────────────────────────────────

function WarehouseSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'warehouses'],
    queryFn: getDashboardWarehouses
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message="فشل تحميل إحصائيات المستودعات" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="لا توجد مستودعات"
        description="لم يتم إضافة أي مستودعات بعد" />);


  }

  return (
    <DataTable
      columns={[
      { accessorKey: 'name', header: 'المستودع' },
      { accessorKey: 'totalProducts', header: 'عدد المنتجات' },
      { accessorKey: 'totalQuantity', header: 'الكمية الإجمالية' },
      {
        accessorKey: 'totalValue',
        header: 'القيمة',
        cell: ({ row }) =>
        `${row.original.totalValue.toLocaleString('ar-EG')} ر.س`
      },
      {
        accessorKey: 'lowStockItems',
        header: 'منخفض المخزون',
        cell: ({ row }) =>
        <Badge variant={row.original.lowStockItems > 0 ? 'destructive' : 'success'}>
              {row.original.lowStockItems}
            </Badge>

      }]
      }
      data={data}
      searchKey="name"
      searchPlaceholder="بحث عن مستودع..." />);


}

// ── Role-based dashboards ────────────────────────────────────────────

function SuperAdminDashboard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <DailyClosingStatusCard />
      <SectionCard title={t('dashboard.smartAnalysis')} icon={Activity}>
        <AnalysisSection />
      </SectionCard>
      <SectionCard title={t('dashboard.systemSummary')} icon={Boxes}>
        <SummarySection />
      </SectionCard>
      <SectionCard title={t('dashboard.inventoryOverview')} icon={Layers}>
        <InventorySection />
      </SectionCard>
      <SectionCard title={t('dashboard.todayOps')} icon={PackagePlus}>
        <TodaySection />
      </SectionCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t('dashboard.consumption')} icon={ShoppingCart}>
          <ConsumptionSection />
        </SectionCard>
        <SectionCard title={t('dashboard.waste')} icon={Trash2}>
          <WasteSection />
        </SectionCard>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title={t('dashboard.reservations')} icon={CalendarCheck}>
          <ReservationSection />
        </SectionCard>
        <SectionCard title={t('dashboard.distributions')} icon={UtensilsCrossed}>
          <DistributionSection />
        </SectionCard>
      </div>
      <SectionCard title={t('dashboard.warehouseStats')} icon={Warehouse}>
        <WarehouseSection />
      </SectionCard>
    </div>
  );
}

function WarehouseManagerDashboard() {
  return (
    <div className="space-y-6">
      <SectionCard title="نظرة عامة على المخزون" icon={Layers}>
        <InventorySection />
      </SectionCard>
      <SectionCard title="عمليات اليوم" icon={PackagePlus}>
        <TodaySection />
      </SectionCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="الاستهلاك" icon={ShoppingCart}>
          <ConsumptionSection />
        </SectionCard>
        <SectionCard title="الهالك" icon={Trash2}>
          <WasteSection />
        </SectionCard>
      </div>
      <SectionCard title="إحصائيات المستودعات" icon={Warehouse}>
        <WarehouseSection />
      </SectionCard>
    </div>
  );
}

function StoreKeeperDashboard() {
  return (
    <div className="space-y-6">
      <SectionCard title="عمليات اليوم" icon={PackagePlus}>
        <TodaySection />
      </SectionCard>
      <SectionCard title="نظرة عامة على المخزون" icon={Layers}>
        <InventorySection />
      </SectionCard>
      <SectionCard title="الهالك" icon={Trash2}>
        <WasteSection />
      </SectionCard>
    </div>
  );
}

function MessOfficerDashboard() {
  return (
    <div className="space-y-6">
      <DailyClosingStatusCard />
      <SectionCard title="مؤشرات اليوم (Meals Overview)" icon={Activity}>
        <MealsOverviewSection />
      </SectionCard>
      
      <SectionCard title="ملخص حركات المخزون (Inventory Movement)" icon={ArrowDownUp}>
        <MovementSummarySection />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="مراقبة الاستهلاك (Consumption)" icon={ShoppingCart}>
          <ConsumptionSection />
        </SectionCard>
        <SectionCard title="مراقبة الهالك (Waste Monitoring)" icon={Trash2}>
          <WasteSection />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="حالات طلبات الحجوزات" icon={CalendarCheck}>
          <ReservationSection />
        </SectionCard>
        <SectionCard title="حالات عمليات التوزيع" icon={UtensilsCrossed}>
          <DistributionSection />
        </SectionCard>
      </div>
      <SectionCard title="الصحة العامة للمخزون (Inventory Health)" icon={Layers}>
        <InventorySection />
      </SectionCard>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const role = user?.roles?.[0] || '';

  const DashboardComponent =
  role === 'Super Administrator' ?
  SuperAdminDashboard :
  role === 'Warehouse Manager' ?
  WarehouseManagerDashboard :
  role === 'Store Keeper' ?
  StoreKeeperDashboard :
  role === 'Mess Officer' ?
  MessOfficerDashboard :
  SuperAdminDashboard;

  return (
    <AppLayout title={t('dashboard.title')}>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {t('dashboard.welcome')} <span className="font-medium text-foreground">{user?.displayName}</span>.
        </p>
      </div>

      <DashboardComponent />
    </AppLayout>);

}