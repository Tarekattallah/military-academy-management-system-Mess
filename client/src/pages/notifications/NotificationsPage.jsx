import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  ExternalLink,
  Filter,
  Package,
  Layers,
  UtensilsCrossed } from
'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { getNotifications } from '../../lib/api/entities';
import { useNotificationStore } from '../../lib/useNotificationStore';

const TYPE_ICON = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const TYPE_COLOR = {
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-primary'
};

const TYPE_BG = {
  error: 'bg-destructive/10 border-destructive/20',
  warning: 'bg-warning/10 border-warning/20',
  info: 'bg-primary/10 border-primary/20'
};

const CATEGORY_LABEL = {
  inventory: { label: 'الدفعات والمخزون', icon: Layers },
  stock: { label: 'حدود المخزون', icon: Package },
  meals: { label: 'الوجبات والطلبات', icon: UtensilsCrossed }
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications
  });

  const { readIds, deletedIds, markAsRead, markAllAsRead, deleteNotification, clearAll } =
  useNotificationStore();

  // Filter out deleted ones
  const activeNotifications = rawNotifications.filter((n) => !deletedIds.includes(n.id));

  // Compute read state
  const notificationsWithReadState = activeNotifications.map((n) => ({
    ...n,
    read: readIds.includes(n.id)
  }));

  const filteredNotifications = notificationsWithReadState.filter((n) => {
    if (filterCategory !== 'all' && n.category !== filterCategory) return false;
    if (filterStatus === 'unread' && n.read) return false;
    if (filterStatus === 'read' && !n.read) return false;
    return true;
  });

  const unreadCount = notificationsWithReadState.filter((n) => !n.read).length;

  function handleNotificationClick(n) {
    markAsRead(n.id);
    if (n.link) {
      navigate(n.link);
    }
  }

  function handleMarkAllAsRead() {
    const allIds = activeNotifications.map((n) => n.id);
    markAllAsRead(allIds);
  }

  function handleClearAll() {
    const allIds = activeNotifications.map((n) => n.id);
    clearAll(allIds);
  }

  return (
    <AppLayout title="مركز الإشعارات">
      <div className="space-y-6">
        {/* Header summary & actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">سجل الإشعارات والتنبيهات</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  إدارة المتابعات والتنبيهات التلقائية للنظام
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 &&
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="size-4" />
                  تحديد الكل كمقروء
                </Button>
              }
              {activeNotifications.length > 0 &&
              <Button variant="outline" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                  مسح الكل
                </Button>
              }
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">التصنيف:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm">
                  
                  <option value="all">جميع التصنيفات</option>
                  <option value="inventory">الدفعات والمخزون</option>
                  <option value="stock">حدود المخزون</option>
                  <option value="meals">الوجبات والطلبات</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">الحالة:</span>
                <div className="flex rounded-md border border-input bg-card p-1">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    filterStatus === 'all' ?
                    'bg-primary text-primary-foreground' :
                    'text-muted-foreground hover:text-foreground'}`
                    }>
                    
                    الكل ({activeNotifications.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('unread')}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    filterStatus === 'unread' ?
                    'bg-primary text-primary-foreground' :
                    'text-muted-foreground hover:text-foreground'}`
                    }>
                    
                    غير مقروء ({unreadCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('read')}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                    filterStatus === 'read' ?
                    'bg-primary text-primary-foreground' :
                    'text-muted-foreground hover:text-foreground'}`
                    }>
                    
                    مقروء ({activeNotifications.length - unreadCount})
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications list */}
        <Card>
          <CardContent className="p-0">
            {isLoading ?
            <div className="space-y-3 p-6">
                {[1, 2, 3, 4].map((i) =>
              <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary" />
              )}
              </div> :
            filteredNotifications.length === 0 ?
            <div className="p-8">
                <EmptyState
                title="لا توجد إشعارات مطابقة"
                description="جميع التنبيهات معالجة أو لا توجد إشعارات جديدة حالياً" />
              
              </div> :

            <div className="divide-y divide-border">
                {filteredNotifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const colorClass = TYPE_COLOR[n.type] ?? 'text-foreground';
                const bgClass = TYPE_BG[n.type] ?? 'bg-secondary';
                const categoryInfo = CATEGORY_LABEL[n.category];
                const CategoryIcon = categoryInfo?.icon ?? Bell;

                return (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-4 p-4 transition-all hover:bg-secondary/40 ${
                    !n.read ? 'bg-primary/5 font-medium' : 'opacity-80'}`
                    }>
                    
                      {/* Status indicator dot */}
                      <div className="flex h-10 items-center justify-center">
                        {!n.read ?
                      <span className="size-2.5 rounded-full bg-primary animate-pulse" title="غير مقروء" /> :

                      <span className="size-2.5 rounded-full bg-transparent" />
                      }
                      </div>

                      {/* Category / type icon */}
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${bgClass}`}>
                        <Icon className={`size-5 ${colorClass}`} />
                      </div>

                      {/* Content */}
                      <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(n)}>
                      
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm ${!n.read ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>
                            {n.title}
                          </h4>
                          {categoryInfo &&
                        <Badge variant="outline" className="gap-1 text-[11px] font-normal">
                              <CategoryIcon className="size-3" />
                              {categoryInfo.label}
                            </Badge>
                        }
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-2 font-mono">
                          {new Date(n.createdAt).toLocaleString('ar-EG', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-90 transition-opacity">
                        {n.link &&
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNotificationClick(n)}
                        title="الانتقال إلى الصفحة"
                        className="gap-1 text-xs">
                        
                            <span>عرض</span>
                            <ExternalLink className="size-3.5" />
                          </Button>
                      }
                        {!n.read &&
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(n.id)}
                        title="تحديد كمقروء"
                        className="text-muted-foreground hover:text-foreground">
                        
                            <CheckCheck className="size-4" />
                          </Button>
                      }
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(n.id)}
                        title="حذف الإشعار"
                        className="text-muted-foreground hover:text-destructive">
                        
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>);

              })}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </AppLayout>);

}