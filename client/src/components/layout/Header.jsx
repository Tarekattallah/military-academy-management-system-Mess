import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUiStore } from '../../lib/uiStore';
import { Button } from '../ui/Button';
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen, User, Sun, Moon, Languages } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useTranslation } from 'react-i18next';

export function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar, setMobileSidebarOpen } = useUiStore();
  const { t, i18n } = useTranslation();

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

  useEffect(() => {
    const currentLang = i18n.language || 'ar';
    document.documentElement.dir = currentLang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('language', nextLang);
    document.documentElement.dir = nextLang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = nextLang;
    
    // Auto-translate entire DOM using Google Translate widget
    if (nextLang === 'en') {
      document.cookie = `googtrans=/ar/en; path=/`;
      document.cookie = `googtrans=/ar/en; path=/; domain=${location.hostname}`;
    } else {
      document.cookie = `googtrans=/ar/ar; path=/`;
      document.cookie = `googtrans=/ar/ar; path=/; domain=${location.hostname}`;
    }
    window.location.reload();
  };

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 sm:gap-3 border-b border-border bg-card px-2 sm:px-4">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileSidebarOpen(true)}>
        <Menu className="size-5" />
      </Button>

      {/* Desktop sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}>
        {isSidebarCollapsed ?
        <PanelLeftOpen className="size-4" /> :
        <PanelLeftClose className="size-4" />
        }
      </Button>

      {/* Title */}
      <h1 className="text-xs sm:text-sm md:text-xl font-bold text-foreground flex-1 truncate">{title}</h1>

      {/* User info & logout */}
      {user &&
        <div className="flex items-center gap-1 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex size-7 md:size-8 items-center justify-center rounded-full bg-primary">
              <User className="size-3 md:size-4 text-primary-foreground" />
            </div>
            <div className="text-sm hidden md:block">
              <p className="font-medium text-foreground text-xs md:text-sm">{user.displayName}</p>
              <p className="text-xs text-muted-foreground hidden lg:block">{user.roles.map(r => t(`userRoles.${r}`, { defaultValue: r })).join(', ') || t('header.noRole')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-1 font-semibold"
            title="تغيير اللغة / Change Language">
            <Languages className="size-4 sm:size-5" />
            <span className="inline-block">{t('header.language')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? t('header.lightMode') : t('header.darkMode')}>
            {isDark ? <Sun className="size-4 sm:size-5 text-warning" /> : <Moon className="size-4 sm:size-5" />}
          </Button>
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={handleLogout} title={t('header.logout')}>
            <LogOut className="size-4" />
          </Button>
        </div>
      }
    </header>
  );
}