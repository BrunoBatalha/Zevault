import { Button } from '@/components/ui';
import { useI18n } from '@/core/i18n';
import { ChevronRight, Pencil } from 'lucide-react';

interface EditInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: 'single' | 'all') => void;
}

export const EditInstallmentModal = ({ isOpen, onClose, onConfirm }: EditInstallmentModalProps) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm dark:bg-black/50">
      <div role="dialog" aria-modal="true" aria-labelledby="edit-installment-title" className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white">
          <div className="rounded-full bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><Pencil className="h-6 w-6" /></div>
          <h2 id="edit-installment-title">{t('transactions.editInstallment.title')}</h2>
        </div>
        <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t('transactions.editInstallment.description')}</p>
        <div className="mb-6 space-y-3">
          <button type="button" onClick={() => onConfirm('single')} className="group flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition-all hover:border-indigo-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-slate-700/50">
            <div><span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('transactions.editInstallment.single')}</span><span className="mt-0.5 block text-xs text-slate-500">{t('transactions.editInstallment.singleHint')}</span></div><ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
          </button>
          <button type="button" onClick={() => onConfirm('all')} className="group flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition-all hover:border-indigo-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-800 dark:hover:bg-slate-700/50">
            <div><span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{t('transactions.editInstallment.all')}</span><span className="mt-0.5 block text-xs text-slate-500">{t('transactions.editInstallment.allHint')}</span></div><ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
          </button>
        </div>
        <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button></div>
      </div>
    </div>
  );
};
