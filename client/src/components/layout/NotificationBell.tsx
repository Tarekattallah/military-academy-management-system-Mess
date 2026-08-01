import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  CheckCheck,
  Trash2,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';
import { getNotifications, type Notification } from '../../lib/api/entities';
import { useNotificationStore } from '../../lib/useNotificationStore';

const TYPE_ICON: Record<string, React.ElementType> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TYPE_COLOR: Record<string, string> = {
  error: 'text-destructive',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

const TYPE_BG: Record<string, string> = {
  error: 'bg-destructive/10 border-destructive/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { readIds, deletedIds, markAsRead, markAllAsRead, deleteNotification } =
    useNotificationStore();

  useEffect(() => {
    // Derive the WebSocket URL from the API base URL so it works in both
    // development (Vite proxy / localhost) and production (random origin).
    const apiBase = import.meta.env.VITE_API_URL as string | undefined;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl: string;

    if (apiBase && !apiBase.startsWith('/')) {
      // Absolute API URL (e.g. https://api.example.com/api/v1) → wss://api.example.com
      wsUrl = apiBase.replace(/^http/, 'ws');
    } else {
      // Same-origin: ws(s)://current-host
      wsUrl = `${wsProtocol}//${window.location.host}`;
    }

    let socket: WebSocket;
    let isMounted = true;
    let reconnectTimeout: any;

    function connect() {
      if (!isMounted) return;
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'notifications_update') {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        } catch (err) {
          console.error('[websocket] Error processing message:', err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error('[websocket] Socket error:', err);
        socket.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [queryClient]);

  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Filter out deleted notifications
  const activeNotifications = rawNotifications.filter((n) => !deletedIds.includes(n.id));

  // Attach read status
  const notifications = activeNotifications.map((n) => ({
    ...n,
    read: readIds.includes(n.id),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleNotificationClick(n: Notification & { read?: boolean }) {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  }

  function handleMarkAllAsRead() {
    const allIds = activeNotifications.map((n) => n.id);
    markAllAsRead(allIds);
  }

  function handleViewAll() {
    setOpen(false);
    navigate('/notifications');
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="الإشعارات"
        title="الإشعارات"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          className="absolute left-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">الإشعارات</h3>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                  {unreadCount} جديد
                </span>
              ) : (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  مكتمل
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title="تعليم الكل كمقروء"
                >
                  <CheckCheck className="size-3.5" />
                  <span>تحديد الكل</span>
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="إغلاق"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-secondary/60" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-secondary">
                  <Bell className="size-6 opacity-40" />
                </div>
                <p className="font-semibold text-foreground">لا توجد إشعارات</p>
                <p className="text-xs text-muted-foreground mt-0.5">أنت على اطلاع بكل التحديثات!</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {notifications.map((n) => {
                  const Icon = TYPE_ICON[n.type] ?? Info;
                  const colorClass = TYPE_COLOR[n.type] ?? 'text-foreground';
                  const bgClass = TYPE_BG[n.type] ?? 'bg-muted';

                  return (
                    <li
                      key={n.id}
                      className={`group relative flex items-start gap-3 p-3.5 transition-colors ${
                        !n.read
                          ? 'bg-primary/5 font-medium'
                          : 'opacity-75 hover:opacity-100 hover:bg-secondary/40'
                      }`}
                    >
                      {/* Unread indicator */}
                      <div className="mt-1 flex items-center justify-center">
                        {!n.read ? (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        ) : (
                          <span className="size-2 rounded-full bg-transparent shrink-0" />
                        )}
                      </div>

                      {/* Icon */}
                      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border ${bgClass}`}>
                        <Icon className={`size-4 ${colorClass}`} />
                      </div>

                      {/* Content */}
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs ${!n.read ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                            {n.title}
                          </p>
                          {n.link && (
                            <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-secondary/20 px-4 py-2.5 text-center">
            <button
              onClick={handleViewAll}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors w-full"
            >
              <span>عرض جميع الإشعارات</span>
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
