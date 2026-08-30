/**
 * Modal de Confirmação
 * Usado para confirmar ações destrutivas ou importantes
 */

import { Button } from '@/components/ui';
import { useI18n } from '@/core/i18n';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  showCancel?: boolean;
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
  showCancel = true,
}: ConfirmationModalProps) => {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusDialog = window.requestAnimationFrame(() => {
      (showCancel ? cancelButtonRef.current : confirmButtonRef.current)?.focus();
    });
    return () => {
      window.cancelAnimationFrame(focusDialog);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, showCancel]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusableElements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) return;
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm transition-all">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        onKeyDown={handleKeyDown}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-white mb-3">
          <div
            className={`p-3 rounded-full ${
              isDanger
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 id="confirmation-modal-title">{title}</h2>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-8 text-sm leading-relaxed pl-1">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          {showCancel && (
            <Button ref={cancelButtonRef} variant="secondary" onClick={onClose}>
              {cancelText || t('common.cancel')}
            </Button>
          )}
          <Button ref={confirmButtonRef} variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText || t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
