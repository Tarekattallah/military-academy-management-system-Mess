import { Badge } from './Badge';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'warning' | 'success' }> = {
  DRAFT: { label: 'مسودة', variant: 'secondary' },
  SUBMITTED: { label: 'مُرسل', variant: 'outline' },
  PENDING_APPROVAL: { label: 'بانتظار الموافقة', variant: 'warning' },
  APPROVED: { label: 'موافق عليه', variant: 'success' },
  REJECTED: { label: 'مرفوض', variant: 'destructive' },
  CANCELLED: { label: 'ملغي', variant: 'secondary' },
  COMPLETED: { label: 'مكتمل', variant: 'success' },
  ACTIVE: { label: 'نشط', variant: 'success' },
  DEPLETED: { label: 'منتهي', variant: 'secondary' },
  EXPIRED: { label: 'منتهي الصلاحية', variant: 'destructive' },
  QUARANTINED: { label: 'محجوز', variant: 'warning' },
  INACTIVE: { label: 'غير نشط', variant: 'secondary' },
  LOCKED: { label: 'مقفل', variant: 'destructive' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
