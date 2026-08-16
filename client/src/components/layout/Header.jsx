import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUiStore } from '../../lib/uiStore';
import { Button } from '../ui/Button';
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen, User, Sun, Moon, Settings, ChevronDown } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { useTranslation } from 'react-i18next';

export function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar, setMobileSidebarOpen } = useUiStore();
  const { t, i18n } = useTranslation();

  const [time, setTime] = useState(new Date());
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Military / Technical Formats
  const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateString = time.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  let hijriString = "";
  try {
    hijriString = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric', month: 'long', year: 'numeric'}).format(time);
  } catch (e) {
    hijriString = "";
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 sm:gap-3 border-b border-border bg-card px-2 sm:px-4 relative">
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

      {/* Military Time/Date Panel (Centered) */}
      <div className="hidden xl:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-stretch border border-border bg-card rounded-md overflow-hidden shadow-sm h-10">
        {/* Date Display */}
        <div className="flex items-center px-4 py-1 bg-accent/20">
          <div className="flex flex-col whitespace-nowrap justify-center">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-foreground font-mono text-sm font-semibold tracking-wide" dir="ltr">{dateString}</span>
              <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">DATE</span>
            </div>
            {hijriString && (
              <div className="flex items-center gap-2 mt-0.5 justify-end">
                <span className="text-muted-foreground font-medium text-[10px]">{hijriString} هـ</span>
                <span className="text-muted-foreground/70 text-[8px] font-bold tracking-widest uppercase">HIJRI</span>
              </div>
            )}
          </div>
        </div>

        {/* Time Display (12H format) */}
        <div className="flex items-center px-4 py-1 border-r border-border bg-accent/40 h-full">
          <div className="flex flex-col whitespace-nowrap justify-center">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-primary font-mono text-base tracking-widest font-bold drop-shadow-sm uppercase" dir="ltr">{timeString}</span>
              <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">TIME</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <div className="flex items-center gap-1.5">
                <span className="text-green-600 dark:text-green-400 text-[9px] font-bold font-mono tracking-wider">SYNCED</span>
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse shadow-sm"></span>
              </div>
              <span className="text-muted-foreground/70 text-[8px] font-bold tracking-widest uppercase">STATUS</span>
            </div>
          </div>
        </div>
      </div>

      {/* User info & logout */}
      {user &&
        <div className="flex items-center gap-1 sm:gap-3">
          <NotificationBell />
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 hover:bg-muted/50 p-1.5 rounded-md transition-colors"
            >
              <div className="flex size-7 md:size-8 items-center justify-center rounded-full bg-primary shadow-sm border border-primary/20">
                <User className="size-3 md:size-4 text-primary-foreground" />
              </div>
              <div className="text-sm hidden md:block text-start">
                <p className="font-medium text-foreground text-xs md:text-sm">{t(`userRoles.${user.displayName}`, { defaultValue: user.displayName })}</p>
                <p className="text-xs text-muted-foreground hidden lg:block">{user.roles.map(r => t(`userRoles.${r}`, { defaultValue: r })).join(', ') || t('header.noRole')}</p>
              </div>
              <ChevronDown className={`size-4 text-muted-foreground mx-1 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute top-full mt-1 end-0 w-52 bg-card border border-border rounded-md shadow-xl py-1 z-50 flex flex-col overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/50 md:hidden bg-muted/20">
                  <p className="font-medium text-foreground text-sm truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.roles[0] || 'User'}</p>
                </div>
                
                <button 
                  onClick={() => { setIsUserMenuOpen(false); navigate('/settings'); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-start"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  <span>{t('header.settings', 'الإعدادات')}</span>
                </button>
                
                <button 
                  onClick={() => { setIsDark(!isDark); setIsUserMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-start"
                >
                  {isDark ? <Sun className="size-4 text-warning" /> : <Moon className="size-4 text-muted-foreground" />}
                  <span>{isDark ? t('header.lightMode', 'الوضع النهاري') : t('header.darkMode', 'الوضع الليلي')}</span>
                </button>

                <div className="h-px bg-border/50 my-1"></div>

                <button 
                  onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-start font-bold"
                >
                  <LogOut className="size-4" />
                  <span>{t('header.logout', 'تسجيل الخروج')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      }
    </header>
  );
}