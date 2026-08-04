import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Download, Activity, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  getInventoryReport,
  getBatchReport,
  getReceivingReport,
  getTransferReport,
  getWasteReport,
  getReservationReport,
  getMealDistributionReport,
  getConsumptionReport,
  getWarehouses,
  getAllProducts } from
'../../lib/api/entities';













const REPORT_TYPES = [
{ value: 'inventory', label: 'تقرير حركة المخزون الكلي' },
{ value: 'batches', label: 'تقرير حالة الدفعات وتواريخ الصلاحية' },
{ value: 'receiving', label: 'تقرير الاستلام والتوريد' },
{ value: 'transfers', label: 'تقرير تحويلات المستودعات' },
{ value: 'wastes', label: 'تقرير المواد التالفة والهدر' },
{ value: 'reservations', label: 'تقرير حجوزات المواد الغذائية' },
{ value: 'meal-distributions', label: 'تقرير توزيع الحصص والوجبات' },
{ value: 'consumption', label: 'تقرير الاستهلاك والتموين العام' }];


export function ReportsPage() {
  const [reportType, setReportType] = useState('inventory');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [product, setProduct] = useState('');

  // Fetch warehouse list for filtering
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses
  });

  // Fetch product list for filtering
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts
  });

  // Build query parameter object
  const queryParams = {
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(warehouse && { warehouse }),
    ...(product && { product })
  };

  // Dynamically choose report fetching function
  const { data: reportData = [], isFetching, refetch } = useQuery({
    queryKey: ['reports', reportType, queryParams],
    queryFn: () => {
      switch (reportType) {
        case 'inventory':
          return getInventoryReport(queryParams);
        case 'batches':
          return getBatchReport(queryParams);
        case 'receiving':
          return getReceivingReport(queryParams);
        case 'transfers':
          return getTransferReport(queryParams);
        case 'wastes':
          return getWasteReport(queryParams);
        case 'reservations':
          return getReservationReport(queryParams);
        case 'meal-distributions':
          return getMealDistributionReport(queryParams);
        case 'consumption':
          return getConsumptionReport(queryParams);
        default:
          return [];
      }
    }
  });

  // Dynamic Column definitions depending on the selected report type
  const getColumns = () => {
    switch (reportType) {
      case 'inventory':
        return [
        { accessorKey: 'productName', header: 'المنتج' },
        { accessorKey: 'warehouseName', header: 'المستودع' },
        { accessorKey: 'inboundQty', header: 'الوارد الكلي', cell: ({ row }) => <span className="font-mono text-success">+{row.original.inboundQty || 0}</span> },
        { accessorKey: 'outboundQty', header: 'المنصرف الكلي', cell: ({ row }) => <span className="font-mono text-destructive">-{row.original.outboundQty || 0}</span> },
        { accessorKey: 'adjustmentQty', header: 'التسويات', cell: ({ row }) => <span className="font-mono">{row.original.adjustmentQty || 0}</span> },
        { accessorKey: 'endingQty', header: 'الرصيد المتبقي', cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.endingQty || 0}</span> }];

      case 'batches':
        return [
        { accessorKey: 'batchNumber', header: 'رقم الدفعة', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.batchNumber}</span> },
        { accessorKey: 'productName', header: 'المنتج' },
        { accessorKey: 'warehouseName', header: 'المستودع' },
        { accessorKey: 'initialQuantity', header: 'الكمية الأصلية', cell: ({ row }) => <span className="font-mono">{row.original.initialQuantity}</span> },
        { accessorKey: 'availableQuantity', header: 'المتاح حالياً', cell: ({ row }) => <span className="font-mono text-primary font-semibold">{row.original.availableQuantity}</span> },
        { accessorKey: 'status', header: 'الحالة', cell: ({ row }) => {
            const statusColors = { active: 'success', expired: 'destructive', depleted: 'secondary', near_expiry: 'warning' };
            const statusLabels = { active: 'نشط', expired: 'منتهي الصلاحية', depleted: 'مستنفذ', near_expiry: 'قريب الانتهاء' };
            return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium bg-${statusColors[row.original.status]}/10 text-${statusColors[row.original.status]}`}>{statusLabels[row.original.status] || row.original.status}</span>;
          }
        },
        { accessorKey: 'expiryDate', header: 'تاريخ الصلاحية', cell: ({ row }) => row.original.expiryDate ? new Date(row.original.expiryDate).toLocaleDateString('ar-EG') : '-' }];

      case 'receiving':
        return [
        { accessorKey: 'receivingNumber', header: 'رقم المستند' },
        { accessorKey: 'supplierName', header: 'المورد' },
        { accessorKey: 'warehouseName', header: 'المستودع المستلم' },
        { accessorKey: 'totalItems', header: 'عدد الأصناف', cell: ({ row }) => <span className="font-mono">{row.original.totalItems || 0}</span> },
        { accessorKey: 'totalCost', header: 'التكلفة الإجمالية', cell: ({ row }) => <span className="font-mono font-bold text-success">{row.original.totalCost?.toLocaleString('ar-EG')} ر.س</span> },
        { accessorKey: 'receivedDate', header: 'تاريخ الاستلام', cell: ({ row }) => new Date(row.original.receivedDate).toLocaleDateString('ar-EG') }];

      case 'transfers':
        return [
        { accessorKey: 'transferNumber', header: 'رقم التحويل' },
        { accessorKey: 'fromWarehouseName', header: 'المستودع المرسل' },
        { accessorKey: 'toWarehouseName', header: 'المستودع المستقبل' },
        { accessorKey: 'totalItems', header: 'الأصناف', cell: ({ row }) => <span className="font-mono">{row.original.totalItems || 0}</span> },
        { accessorKey: 'status', header: 'الحالة', cell: ({ row }) => row.original.status === 'completed' ? 'مكتمل' : 'قيد التحويل' },
        { accessorKey: 'transferDate', header: 'التاريخ', cell: ({ row }) => new Date(row.original.transferDate).toLocaleDateString('ar-EG') }];

      case 'wastes':
        return [
        { accessorKey: 'wasteNumber', header: 'رقم الهدر' },
        { accessorKey: 'warehouseName', header: 'المستودع' },
        { accessorKey: 'productName', header: 'المنتج' },
        { accessorKey: 'quantity', header: 'الكمية التالفة', cell: ({ row }) => <span className="font-mono text-destructive">{row.original.quantity}</span> },
        { accessorKey: 'reason', header: 'السبب' },
        { accessorKey: 'wasteDate', header: 'التاريخ', cell: ({ row }) => new Date(row.original.wasteDate).toLocaleDateString('ar-EG') }];

      case 'reservations':
        return [
        { accessorKey: 'reservationNumber', header: 'رقم الحجز' },
        { accessorKey: 'requestingUnit', header: 'الجهة الطالبة' },
        { accessorKey: 'warehouseName', header: 'المستودع' },
        { accessorKey: 'status', header: 'الحالة', cell: ({ row }) => row.original.status },
        { accessorKey: 'totalCost', header: 'القيمة التقديرية', cell: ({ row }) => <span className="font-mono">{row.original.totalCost || 0} ر.س</span> },
        { accessorKey: 'reservedDate', header: 'تاريخ الحجز', cell: ({ row }) => new Date(row.original.reservedDate).toLocaleDateString('ar-EG') }];

      case 'meal-distributions':
        return [
        { accessorKey: 'distributionNumber', header: 'رقم التوزيع' },
        { accessorKey: 'requestingUnit', header: 'الكتيبة' },
        { accessorKey: 'status', header: 'الحالة' },
        { accessorKey: 'totalItems', header: 'الأصناف المستهلكة', cell: ({ row }) => <span className="font-mono">{row.original.totalItems || 0}</span> },
        { accessorKey: 'distributionDate', header: 'التاريخ', cell: ({ row }) => new Date(row.original.distributionDate).toLocaleDateString('ar-EG') }];

      case 'consumption':
        return [
        { accessorKey: 'productName', header: 'المنتج الغذائي' },
        { accessorKey: 'totalQuantity', header: 'الكمية المستهلكة الكلية', cell: ({ row }) => <span className="font-mono text-primary font-bold">{row.original.totalQuantity || 0}</span> },
        { accessorKey: 'totalCost', header: 'التكلفة الإجمالية', cell: ({ row }) => <span className="font-mono text-success">{(row.original.totalCost || 0).toLocaleString('ar-EG')} ر.س</span> }];

      default:
        return [];
    }
  };

  function handleExportCsv() {
    if (!reportData || reportData.length === 0) return toast.error('لا توجد بيانات لتصديرها');

    // Simple CSV generator
    const columns = getColumns();
    const headers = columns.map((col) => col.header).join(',');
    const rows = reportData.map((row) =>
    columns.map((col) => {
      const val = row[col.accessorKey];
      return typeof val === 'object' ? JSON.stringify(val) : `"${String(val || '').replace(/"/g, '""')}"`;
    }).join(',')
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n'); // Arabic support byte order mark
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير التقرير كملف CSV بنجاح');
  }

  return (
    <AppLayout title="لوحة التقارير الذكية">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-primary" />
              تصفية واستعلام
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="نوع التقرير">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                
                {REPORT_TYPES.map((type) =>
                <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                )}
              </select>
            </FormField>

            <FormField label="تاريخ البداية">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormField>

            <FormField label="تاريخ النهاية">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormField>

            <FormField label="المستودع">
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                
                <option value="">كافة المستودعات</option>
                {warehouses.map((w) =>
                <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                )}
              </select>
            </FormField>

            <FormField label="المنتج">
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                
                <option value="">كافة المنتجات</option>
                {products.map((p) =>
                <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                )}
              </select>
            </FormField>

            <Button className="w-full mt-2" onClick={() => refetch()} isLoading={isFetching}>
              تحديث التقرير
            </Button>
          </CardContent>
        </Card>

        {/* Report Content Table */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              {REPORT_TYPES.find((t) => t.value === reportType)?.label}
            </CardTitle>
            <div className="flex items-center gap-2 print-hide">
              <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={reportData.length === 0}>
                <Download className="size-4" />
                تصدير CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                disabled={reportData.length === 0}>
                
                <Printer className="size-4" />
                طباعة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isFetching ?
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) =>
              <div key={i} className="h-10 animate-pulse rounded-md bg-secondary" />
              )}
              </div> :
            reportData.length === 0 ?
            <EmptyState title="لا توجد بيانات" description="لا توجد سجلات تطابق خيارات التصفية المحددة حالياً" /> :

            <DataTable
              columns={getColumns()}
              data={reportData}
              searchKey={
              reportType === 'inventory' || reportType === 'batches' || reportType === 'consumption' ?
              'productName' :
              reportType === 'receiving' ?
              'receivingNumber' :
              reportType === 'transfers' ?
              'transferNumber' :
              reportType === 'wastes' ?
              'wasteNumber' :
              reportType === 'reservations' ?
              'reservationNumber' :
              'distributionNumber'
              }
              searchPlaceholder="بحث في نتائج التقرير..." />

            }
          </CardContent>
        </Card>
      </div>
    </AppLayout>);

}