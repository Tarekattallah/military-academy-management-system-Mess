import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDashboardSummary,
  getDashboardInventory,
  getDashboardToday,
  getDashboardConsumption,
  getDashboardWaste,
  getDashboardReservations,
  getDashboardDistributions,
  getDashboardWarehouses,
} from '../../lib/api/entities';
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
  type LucideIcon,
} from 'lucide-react';

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'destructive' | 'success';
}) {
  const iconBgMap = {
    default: 'bg-accent text-accent-foreground',
    warning: 'bg-warning/15 text-warning-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-success/15 text-success-foreground',
  };

  const valueColorMap = {
    default: 'text-foreground',
    warning: 'text-warning-foreground',
    destructive: 'text-destructive',
    success: 'text-success-foreground',
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
    </Card>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
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
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center">
      <p className="text-destructive">{message}</p>
    </div>
  );
}

// ── Summary Section ──────────────────────────────────────────────────

function SummarySection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
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
    </div>
  );
}

// ── Inventory Section ────────────────────────────────────────────────

function InventorySection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'inventory'],
    queryFn: getDashboardInventory,
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
    </div>
  );
}

// ── Today's Operations Section ───────────────────────────────────────

function TodaySection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: getDashboardToday,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل عمليات اليوم" />;

  const hasData = data.receivingsToday > 0 || data.transfersToday > 0 || data.wasteRecordsToday > 0 || data.reservationsToday > 0 || data.mealDistributionsToday > 0;

  if (!hasData) {
    return (
      <EmptyState
        title="لا توجد عمليات اليوم"
        description="لم يتم تسجيل أي عمليات حتى الآن"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard icon={PackagePlus} label="استلام" value={data.receivingsToday} tone="success" />
      <KpiCard icon={ArrowDownUp} label="تحويلات" value={data.transfersToday} />
      <KpiCard icon={Trash2} label="هالك" value={data.wasteRecordsToday} tone="destructive" />
      <KpiCard icon={CalendarCheck} label="حجوزات" value={data.reservationsToday} />
      <KpiCard icon={UtensilsCrossed} label="توزيعات" value={data.mealDistributionsToday} tone="success" />
    </div>
  );
}

// ── Consumption Section ──────────────────────────────────────────────

function ConsumptionSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'consumption'],
    queryFn: getDashboardConsumption,
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

      {data.topConsumedProducts.length > 0 && (
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
                cell: ({ row }: { row: { original: { totalCost: number } } }) =>
                  `${row.original.totalCost.toLocaleString('ar-EG')} ر.س`,
              },
            ]}
            data={data.topConsumedProducts}
            searchKey="productName"
            searchPlaceholder="بحث..."
          />
        </div>
      )}

      {data.topRecipes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">أكثر الوصفات توزيعاً</h4>
          <DataTable
            columns={[
              { accessorKey: 'recipeName', header: 'الوصفة' },
              { accessorKey: 'recipeNumber', header: 'رقم الوصفة' },
              { accessorKey: 'totalDistributed', header: 'مرات التوزيع' },
              { accessorKey: 'totalIngredientsUsed', header: 'المكونات المستخدمة' },
            ]}
            data={data.topRecipes}
            searchKey="recipeName"
            searchPlaceholder="بحث..."
          />
        </div>
      )}
    </div>
  );
}

// ── Waste Section ────────────────────────────────────────────────────

function WasteSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'waste'],
    queryFn: getDashboardWaste,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات الهالك" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard icon={Trash2} label="هالك اليوم" value={data.totalWasteToday} tone="destructive" />
        <KpiCard icon={Trash2} label="هالك الشهر" value={data.totalWasteThisMonth} tone="warning" />
      </div>

      {data.topWastedProducts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">أكثر المنتجات هالكاً</h4>
          <DataTable
            columns={[
              { accessorKey: 'productName', header: 'المنتج' },
              { accessorKey: 'totalQuantity', header: 'الكمية' },
            ]}
            data={data.topWastedProducts}
            searchKey="productName"
            searchPlaceholder="بحث..."
          />
        </div>
      )}
    </div>
  );
}

// ── Reservation Section ──────────────────────────────────────────────

function ReservationSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'reservations'],
    queryFn: getDashboardReservations,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات الحجوزات" />;

  const hasData = Object.values(data as unknown as Record<string, number>).some((v) => v > 0);

  if (!hasData) {
    return (
      <EmptyState
        title="لا توجد حجوزات"
        description="لم يتم تسجيل أي حجوزات بعد"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard icon={CalendarCheck} label="مسودة" value={data.draft} />
      <KpiCard icon={CalendarCheck} label="محجوز" value={data.reserved} tone="success" />
      <KpiCard icon={ClipboardCheck} label="مستهلك" value={data.consumed} tone="success" />
      <KpiCard icon={Undo2} label="ملغي" value={data.cancelled} tone="destructive" />
      <KpiCard icon={Undo2} label="محرر" value={data.released} tone="warning" />
    </div>
  );
}

// ── Distribution Section ─────────────────────────────────────────────

function DistributionSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'distributions'],
    queryFn: getDashboardDistributions,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return <ErrorCard message="فشل تحميل بيانات التوزيعات" />;

  const hasData = Object.values(data as unknown as Record<string, number>).some((v) => v > 0);

  if (!hasData) {
    return (
      <EmptyState
        title="لا توجد توزيعات"
        description="لم يتم تسجيل أي توزيعات بعد"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={ClipboardCheck} label="مسودة" value={data.draft} />
      <KpiCard icon={ArrowDownUp} label="قيد التنفيذ" value={data.inProgress} tone="warning" />
      <KpiCard icon={PackageCheck} label="مكتمل" value={data.completed} tone="success" />
      <KpiCard icon={Undo2} label="ملغي" value={data.cancelled} tone="destructive" />
    </div>
  );
}

// ── Warehouse Section ────────────────────────────────────────────────

function WarehouseSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'warehouses'],
    queryFn: getDashboardWarehouses,
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorCard message="فشل تحميل إحصائيات المستودعات" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="لا توجد مستودعات"
        description="لم يتم إضافة أي مستودعات بعد"
      />
    );
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
          cell: ({ row }: { row: any }) =>
            `${row.original.totalValue.toLocaleString('ar-EG')} ر.س`,
        },
        {
          accessorKey: 'lowStockItems',
          header: 'منخفض المخزون',
          cell: ({ row }: { row: any }) => (
            <Badge variant={row.original.lowStockItems > 0 ? 'destructive' : 'success'}>
              {row.original.lowStockItems}
            </Badge>
          ),
        },
      ]}
      data={data}
      searchKey="name"
      searchPlaceholder="بحث عن مستودع..."
    />
  );
}

// ── Role-based dashboards ────────────────────────────────────────────

function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <SectionCard title="ملخص النظام" icon={Boxes}>
        <SummarySection />
      </SectionCard>
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="الحجوزات" icon={CalendarCheck}>
          <ReservationSection />
        </SectionCard>
        <SectionCard title="التوزيعات" icon={UtensilsCrossed}>
          <DistributionSection />
        </SectionCard>
      </div>
      <SectionCard title="إحصائيات المستودعات" icon={Warehouse}>
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
      <SectionCard title="الاستهلاك" icon={ShoppingCart}>
        <ConsumptionSection />
      </SectionCard>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="الحجوزات" icon={CalendarCheck}>
          <ReservationSection />
        </SectionCard>
        <SectionCard title="التوزيعات" icon={UtensilsCrossed}>
          <DistributionSection />
        </SectionCard>
      </div>
      <SectionCard title="نظرة عامة على المخزون" icon={Layers}>
        <InventorySection />
      </SectionCard>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const role = user?.roles?.[0] || '';

  const DashboardComponent =
    role === 'Super Administrator'
      ? SuperAdminDashboard
      : role === 'Warehouse Manager'
        ? WarehouseManagerDashboard
        : role === 'Store Keeper'
          ? StoreKeeperDashboard
          : role === 'Mess Officer'
            ? MessOfficerDashboard
            : SuperAdminDashboard;

  return (
    <AppLayout title="لوحة التحكم">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          مرحباً بعودتك، <span className="font-medium text-foreground">{user?.displayName}</span>.
        </p>
      </div>

      <DashboardComponent />
    </AppLayout>
  );
}
