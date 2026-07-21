import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { Boxes, AlertTriangle, Trash2, ClipboardCheck, ArrowDownUp, PackageCheck } from 'lucide-react';

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'destructive' | 'success';
}) {
  const iconBgMap = {
    default: 'bg-accent text-accent-foreground',
    warning: 'bg-warning/15 text-warning-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-success/15 text-success-foreground',
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
        <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function SuperAdminDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={Boxes} label="إجمالي المخزون" value="—" />
      <KpiCard icon={AlertTriangle} label="مخزون منخفض" value="—" tone="warning" />
      <KpiCard icon={Trash2} label="منتهي الصلاحية" value="—" tone="destructive" />
      <KpiCard icon={ClipboardCheck} label="معلقة" value="—" />
    </div>
  );
}

function WarehouseManagerDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={Boxes} label="إجمالي المخزون" value="—" />
      <KpiCard icon={AlertTriangle} label="مخزون منخفض" value="—" tone="warning" />
      <KpiCard icon={Trash2} label="منتهي الصلاحية" value="—" tone="destructive" />
      <KpiCard icon={ClipboardCheck} label="معلقة" value="—" />
    </div>
  );
}

function StoreKeeperDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={PackageCheck} label="استلام اليوم" value="—" tone="success" />
      <KpiCard icon={ArrowDownUp} label="تحويلات مفتوحة" value="—" />
      <KpiCard icon={AlertTriangle} label="جرد مستحق" value="—" tone="warning" />
      <KpiCard icon={Trash2} label="ملخص الهالك" value="—" tone="destructive" />
    </div>
  );
}

function MessOfficerDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={ClipboardCheck} label="قائمة اليوم" value="—" tone="success" />
      <KpiCard icon={Boxes} label="عدد الحضور" value="—" />
      <KpiCard icon={AlertTriangle} label="مخزون منخفض" value="—" tone="warning" />
      <KpiCard icon={ArrowDownUp} label="حجوزات نشطة" value="—" />
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
