import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUiStore } from '../../lib/uiStore';
import {
  LayoutDashboard,
  Users,
  Shield,
  Package,
  Tags,
  Ruler,
  Truck,
  Warehouse,
  PackagePlus,
  ArrowLeftRight,
  Undo2,
  Trash2,
  ClipboardList,
  Layers,
  ClipboardCheck,
  UtensilsCrossed,
  BookOpen,
  ClipboardPenLine,
  ClipboardMinus,
  CalendarCheck,
  BarChart3,
  Settings,
  User,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/users', label: 'المستخدمين', icon: Users, permission: 'users:view' },
  { to: '/roles', label: 'الصلاحيات', icon: Shield, permission: 'roles:view' },
  { to: '/products', label: 'المنتجات', icon: Package, permission: 'products:view' },
  { to: '/categories', label: 'التصنيفات', icon: Tags, permission: 'categories:view' },
  { to: '/units', label: 'الوحدات', icon: Ruler, permission: 'units:view' },
  { to: '/suppliers', label: 'الموردين', icon: Truck, permission: 'suppliers:view' },
  { to: '/warehouses', label: 'المستودعات', icon: Warehouse, permission: 'warehouses:view' },
  { to: '/receiving', label: 'استلام البضائع', icon: PackagePlus, permission: 'receiving:view' },
  { to: '/transfers', label: 'التحويلات', icon: ArrowLeftRight, permission: 'transfers:view' },
  { to: '/returns', label: 'المرتجعات', icon: Undo2, permission: 'returns:view' },
  { to: '/waste', label: 'الهالك', icon: Trash2, permission: 'wastes:view' },
  { to: '/stock-counts', label: 'جرد المخزون', icon: ClipboardList, permission: 'stock-counts:view' },
  { to: '/batches', label: 'الدفعات', icon: Layers, permission: 'batches:view' },
  { to: '/inventory', label: 'المخزون', icon: ClipboardCheck, permission: 'inventory-transactions:view' },
  { to: '/menus', label: 'قوائم الطعام', icon: UtensilsCrossed, permission: 'menus:view' },
  { to: '/recipes', label: 'الوصفات', icon: BookOpen, permission: 'recipes:view' },
  { to: '/meal-attendance', label: 'الحضور', icon: ClipboardPenLine, permission: 'meal-attendance:view' },
  { to: '/meal-requests', label: 'طلبات الوجبات', icon: ClipboardMinus, permission: 'meal-requests:view' },
  { to: '/reservations', label: 'الحجوزات', icon: CalendarCheck, permission: 'reservations:view' },
  { to: '/reports', label: 'التقارير', icon: BarChart3, permission: 'reports:view' },
  { to: '/settings', label: 'الإعدادات', icon: Settings, permission: 'settings:view' },
];

export function Sidebar() {
  const { user, hasPermission } = useAuth();
  const { isSidebarCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  const visibleItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const sidebarContent = (
    <aside
      className={`flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-accent">
              <Warehouse className="size-5 text-sidebar-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight">نظام المستودعات</p>
              <p className="text-[10px] leading-tight text-sidebar-muted">المطاعم العسكرية</p>
            </div>
          </div>
        )}
        {isSidebarCollapsed && (
          <div className="mx-auto flex size-8 items-center justify-center rounded-md bg-sidebar-accent">
            <Warehouse className="size-5 text-sidebar-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`
                }
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <Icon className="size-5 shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User info */}
      {user && (
        <div className="border-t border-sidebar-border p-3">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent">
                <User className="size-4 text-sidebar-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-sidebar-muted truncate">{user.roles.join(', ') || 'بدون دور'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent">
                <User className="size-4 text-sidebar-foreground" />
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-64 shadow-lg">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
