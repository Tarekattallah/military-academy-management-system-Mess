import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { getNotifications, type Notification } from '../../lib/api/entities';

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
  error: 'bg-destructive/10',
  warning: 'bg-amber-500/10',
  info: 'bg-blue-500/10',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:5000`;
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
            console.log('[websocket] Received notifications_update event, invalidating queries...');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        } catch (err) {
          console.error('[websocket] Error processing message:', err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.log('[websocket] Connection closed, retrying in 5s...');
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

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60_000, // Poll every 60 seconds
    staleTime: 30_000,
  });

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

  const count = notifications.length;

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
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          className="absolute left-0 top-11 z-50 w-96 max-h-[480px] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">الإشعارات</h3>
              {count > 0 && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                  {count}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Body */}
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-secondary" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto mb-2 size-8 opacity-30" />
              لا توجد إشعارات حالياً
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n: Notification) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                const color = TYPE_COLOR[n.type] ?? 'text-foreground';
                const bg = TYPE_BG[n.type] ?? 'bg-muted';
                return (
                  <li key={n.id} className="flex gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg}`}>
                      <Icon className={`size-4 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${color}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{n.message}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
