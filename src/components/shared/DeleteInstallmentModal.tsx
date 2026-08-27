/**
 * Modal de Deleção de Parcelas
 * Permite escolher como deletar transações parceladas
 */

import { Button } from '@/components/ui';
import { useI18n } from '@/core/i18n';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface DeleteInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'single' | 'remaining' | 'all') => void;
}

export const DeleteInstallmentModal = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteInstallmentModalProps) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm transition-all">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white mb-4">
          <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          {t('transactions.deleteInstallment.title')}
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
          {t('transactions.deleteInstallment.description')}
        </p>
        <div className="space-y-3 mb-6">
          <button
            onClick={() => onConfirm('single')}
            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-800"
          >
            <div>
              <span className="block font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {t('transactions.deleteInstallment.single')}
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                {t('transactions.deleteInstallment.singleHint')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
          </button>
          <button
            onClick={() => onConfirm('remaining')}
            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-800"
          >
            <div>
              <span className="block font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {t('transactions.deleteInstallment.future')}
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                {t('transactions.deleteInstallment.futureHint')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
          </button>
          <button
            onClick={() => onConfirm('all')}
            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-800"
          >
            <div>
              <span className="block font-semibold text-slate-700 dark:text-slate-200 text-sm">
                {t('transactions.deleteInstallment.all')}
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                {t('transactions.deleteInstallment.allHint')}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
          </button>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
};
