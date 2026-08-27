import { useI18n } from '@/core/i18n';
import { ArrowLeftRight, Command, CreditCard, LayoutDashboard, Settings, Tags, Wallet } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const actions = [
    { path: '/', label: t('navigation.dashboard'), icon: LayoutDashboard },
    { path: '/accounts', label: t('navigation.accounts'), icon: Wallet },
    { path: '/credit-cards', label: t('navigation.creditCards'), icon: CreditCard },
    { path: '/transactions', label: t('navigation.transactions'), icon: ArrowLeftRight },
    { path: '/categories', label: t('navigation.categories'), icon: Tags },
    { path: '/settings', label: t('navigation.settings'), icon: Settings },
  ];

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleAction = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-start justify-center pt-[20vh] bg-black/30 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
          <Command className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          <input
            autoFocus
            type="text"
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 outline-none bg-transparent text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-400">
            ESC
          </span>
        </div>
        <div className="p-2">
          {filteredActions.length > 0 ? (
            filteredActions.map((action) => (
              <button
                key={action.path}
                onClick={() => handleAction(action.path)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <action.icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                {action.label}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('commandPalette.noResults')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
