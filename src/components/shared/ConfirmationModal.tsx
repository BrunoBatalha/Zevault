/**
 * Modal de Confirmação
 * Usado para confirmar ações destrutivas ou importantes
 */

import { Button } from '@/components/ui';
import { useI18n } from '@/core/i18n';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = true,
}: ConfirmationModalProps) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm transition-all">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white mb-3">
          <div
            className={`p-3 rounded-full ${
              isDanger
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          {title}
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-sm leading-relaxed pl-1">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {cancelText || t('common.cancel')}
          </Button>
          <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText || t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
