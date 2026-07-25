import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUiStore } from '../../lib/uiStore';
import { Button } from '../ui/Button';
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen, User, Sun, Moon } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export function Header({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar, setMobileSidebarOpen } = useUiStore();

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </Button>

      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground flex-1">{title}</h1>

      {/* User info & logout */}
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary">
              <User className="size-4 text-primary-foreground" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">{user.roles.join(', ') || 'بدون دور'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع المظلم'}
          >
            {isDark ? <Sun className="size-5 text-warning" /> : <Moon className="size-5" />}
          </Button>
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={handleLogout} title="تسجيل الخروج">
            <LogOut className="size-4" />
          </Button>
        </div>
      )}
    </header>
  );
}
