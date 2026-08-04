import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { getAuditLogs, deleteAuditLog, clearAuditLogs } from '../../lib/api/entities';
import { ClipboardList, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ACTION_LABELS = {
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  reject: 'رفض',
  login: 'دخول',
  logout: 'خروج',
  view: 'عرض'
};

const ACTION_VARIANTS = {
  create: 'success',
  update: 'secondary',
  delete: 'destructive',
  approve: 'success',
  reject: 'destructive',
  login: 'secondary',
  logout: 'secondary',
  view: 'secondary'
};

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [username, setUsername] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, module, action, username, startDate, endDate],
    queryFn: () =>
    getAuditLogs({
      page,
      limit: 25,
      module: module || undefined,
      action: action || undefined,
      username: username || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    })
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  function handleApplyFilters() {
    setPage(1);
  }

  function handleClearFilters() {
    setModule('');
    setAction('');
    setUsername('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  const deleteMutation = useMutation({
    mutationFn: deleteAuditLog,
    onSuccess: () => {
      toast.success('تم حذف السجل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: () => toast.error('فشل حذف السجل')
  });

  const clearMutation = useMutation({
    mutationFn: clearAuditLogs,
    onSuccess: (res) => {
      toast.success(res.message || 'تم مسح السجلات بنجاح');
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: () => toast.error('فشل مسح السجلات')
  });

  function handleDelete(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      deleteMutation.mutate(id);
    }
  }

  function handleClearAll() {
    if (confirm('هل أنت متأكد من مسح جميع سجلات النشاط؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      clearMutation.mutate();
    }
  }

  return (
    <AppLayout title="سجل النشاطات">
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>فلاتر البحث</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">اسم المستخدم</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="بحث باسم المستخدم..." />
                
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">الوحدة</label>
                <Input
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  placeholder="مثال: products, batches..." />
                
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">الإجراء</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  
                  <option value="">جميع الإجراءات</option>
                  <option value="create">إنشاء</option>
                  <option value="update">تعديل</option>
                  <option value="delete">حذف</option>
                  <option value="approve">موافقة</option>
                  <option value="reject">رفض</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">من تاريخ</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)} />
                
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">إلى تاريخ</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)} />
                
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleApplyFilters}>تطبيق الفلاتر</Button>
                <Button variant="outline" onClick={handleClearFilters}>مسح</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5" />
              سجل النشاطات
              {pagination &&
              <span className="text-sm font-normal text-muted-foreground">
                  ({pagination.total.toLocaleString('ar-EG')} سجل)
                </span>
              }
            </CardTitle>
            <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={logs.length === 0 || clearMutation.isPending}>
              <Trash2 className="size-4 ml-1" />
              مسح السجلات
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ?
            <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) =>
              <div key={i} className="h-12 animate-pulse rounded-md bg-secondary" />
              )}
              </div> :
            error ?
            <div className="text-center text-destructive py-8 font-medium">
                فشل تحميل سجل النشاطات: {error.message}
              </div> :
            logs.length === 0 ?
            <EmptyState
              title="لا توجد سجلات"
              description="لم يتم تسجيل أي نشاطات بعد، أو لا توجد نتائج تطابق الفلاتر المحددة." /> :


            <div className="rounded-md border border-border overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-secondary text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">التاريخ والوقت</th>
                      <th className="px-3 py-2 font-medium">المستخدم</th>
                      <th className="px-3 py-2 font-medium">الإجراء</th>
                      <th className="px-3 py-2 font-medium">الوحدة</th>
                      <th className="px-3 py-2 font-medium">المرجع</th>
                      <th className="px-3 py-2 font-medium">IP</th>
                      <th className="px-3 py-2 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) =>
                  <tr key={log._id} className="hover:bg-secondary/50">
                        <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('ar-EG')}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs font-medium">{log.username || '—'}</td>
                        <td className="px-3 py-2">
                          <Badge variant={ACTION_VARIANTS[log.action] ?? 'secondary'}>
                            {ACTION_LABELS[log.action] ?? log.action}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs font-mono">{log.module}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground max-w-[12rem] truncate" title={log.documentId || log.path || ''}>
                          {log.documentId || log.path || '—'}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{log.ipAddress || '—'}</td>
                        <td className="px-3 py-2">
                          <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(log._id)}>
                        
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            }

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 &&
            <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
                <span className="text-xs text-muted-foreground">
                  صفحة {pagination.page} من {pagination.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}>
                  
                    <ChevronRight className="size-4" />
                    السابق
                  </Button>
                  <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}>
                  
                    التالي
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </AppLayout>);

}