import { useTheme } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import { APP_VERSION } from '@/core/utils/constants';
import { ArrowLeftRight, ChevronLeft, ChevronRight, CreditCard, LayoutDashboard, LogOut, MoreHorizontal, Moon, Settings, Sun, Tags, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  userName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'navigation.dashboard' },
  { path: '/accounts', icon: Wallet, labelKey: 'navigation.accounts' },
  { path: '/credit-cards', icon: CreditCard, labelKey: 'navigation.creditCards' },
  { path: '/transactions', icon: ArrowLeftRight, labelKey: 'navigation.transactions' },
  { path: '/categories', icon: Tags, labelKey: 'navigation.categories' },
  { path: '/settings', icon: Settings, labelKey: 'navigation.settings' },
];

export const Sidebar = ({ userName, isCollapsed, onToggleCollapse, onLogout }: SidebarProps) => {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isMoreOpen, setMoreOpen] = useState(false);
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <aside className={`fixed left-0 top-0 z-20 hidden h-screen border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 lg:block ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3"><img src="/zevault-mark.png" alt="" className="h-10 w-10 shrink-0 rounded-xl object-contain" />{isCollapsed ? null : <span className="truncate text-xl font-bold text-slate-950 dark:text-white">Zevault</span>}</div>
              <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? t('app.openNavigation') : t('app.closeNavigation')} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-slate-700">{isCollapsed ? <ChevronRight aria-hidden="true" className="h-5 w-5 text-slate-500" /> : <ChevronLeft aria-hidden="true" className="h-5 w-5 text-slate-500" />}</button>
            </div>
          </div>

          {isCollapsed ? null : <div className="border-b border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{userName.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{userName}</p><p className="text-xs text-slate-500 dark:text-slate-400">{t('common.welcome')}</p></div></div></div>}

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label={t('app.primaryNavigation')}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return <Link key={item.path} to={item.path} aria-current={active ? 'page' : undefined} title={isCollapsed ? t(item.labelKey) : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'} ${isCollapsed ? 'justify-center' : ''}`}><Icon aria-hidden="true" className="h-5 w-5 shrink-0" />{isCollapsed ? null : <span>{t(item.labelKey)}</span>}</Link>;
            })}
          </nav>

          <div className="space-y-2 border-t border-slate-200 p-4 dark:border-slate-700">
            <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('app.toggleTheme')} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-slate-400 dark:hover:bg-slate-700 ${isCollapsed ? 'justify-center' : ''}`}>{theme === 'dark' ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}{isCollapsed ? null : <span>{theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}</span>}</button>
            <button type="button" onClick={onLogout} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600 dark:text-rose-300 dark:hover:bg-rose-950/30 ${isCollapsed ? 'justify-center' : ''}`}><LogOut aria-hidden="true" className="h-5 w-5" />{isCollapsed ? null : <span>{t('common.logout')}</span>}</button>
            <p className="pt-1 text-center text-xs font-medium text-slate-400 dark:text-slate-500">v{APP_VERSION}</p>
          </div>
        </div>
      </aside>

      <nav aria-label={t('app.mobileNavigation')} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:hidden">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return <Link key={item.path} to={item.path} aria-current={active ? 'page' : undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-emerald-600 ${active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}><Icon aria-hidden="true" className="h-5 w-5" /><span className="max-w-full truncate">{t(item.labelKey)}</span></Link>;
        })}
        <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={isMoreOpen} className="flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-semibold text-slate-500 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-slate-400"><MoreHorizontal aria-hidden="true" className="h-5 w-5" /><span>{t('app.more')}</span></button>
      </nav>
      {isMoreOpen ? <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMoreOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><h2 id="mobile-more-title" className="text-lg font-bold text-slate-950 dark:text-white">{t('app.more')}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{userName}</p></div><button type="button" onClick={() => setMoreOpen(false)} aria-label={t('common.close')} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X aria-hidden="true" className="h-5 w-5" /></button></div><div className="mt-4 grid gap-2">{navItems.slice(4).map((item) => { const Icon = item.icon; return <Link key={item.path} to={item.path} onClick={() => setMoreOpen(false)} className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200"><Icon aria-hidden="true" className="h-5 w-5" />{t(item.labelKey)}</Link>; })}<button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">{theme === 'dark' ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}{theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}</button><button type="button" onClick={onLogout} className="flex min-h-12 items-center gap-3 rounded-xl bg-rose-50 px-4 font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><LogOut aria-hidden="true" className="h-5 w-5" />{t('common.logout')}</button></div></section></div> : null}
    </>
  );
};
