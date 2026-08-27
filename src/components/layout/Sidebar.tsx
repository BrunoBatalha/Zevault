import { useTheme } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import {
    ArrowLeftRight,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Moon,
    Settings,
    Sun,
    Tags,
    Wallet,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  userName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, labelKey: 'navigation.dashboard' },
  { path: '/accounts', icon: Wallet, labelKey: 'navigation.accounts' },
  { path: '/credit-cards', icon: CreditCard, labelKey: 'navigation.creditCards' },
  { path: '/transactions', icon: ArrowLeftRight, labelKey: 'navigation.transactions' },
  { path: '/categories', icon: Tags, labelKey: 'navigation.categories' },
  { path: '/settings', icon: Settings, labelKey: 'navigation.settings' },
];

export const Sidebar = ({
  userName,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}: SidebarProps) => {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-20 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Financier
                </span>
              )}
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white text-sm">
                  {userName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('common.welcome')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                {!isCollapsed && (
                  <span className={`font-medium ${isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                    {t(item.labelKey)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? t('settings.theme') : undefined}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!isCollapsed && (
              <span className="font-medium">
                {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? t('common.logout') : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">{t('common.logout')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
