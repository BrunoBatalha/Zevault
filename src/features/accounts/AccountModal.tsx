/**
 * Modal de Conta
 * Formulário para criar/editar contas bancárias
 */

import { Button } from '@/components/ui';
import { db } from '@/core/database';
import { useI18n } from '@/core/i18n';
import type { Account } from '@/types';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
}

export const AccountModal = ({ isOpen, onClose, accountToEdit = null }: AccountModalProps) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState(() => ({
    name: accountToEdit?.name ?? '',
    balance: accountToEdit?.balance ?? 0,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const payload = {
        ...formData,
        balance: parseFloat(String(formData.balance)),
      };

      if (accountToEdit?.id) {
        await db.update('accounts', accountToEdit.id, payload);
      } else {
        await db.add('accounts', payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {accountToEdit ? t('accounts.modal.editTitle') : t('accounts.modal.newTitle')}
          </h3>
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('accounts.modal.name')}
            </label>
            <input
              type="text"
              required
              placeholder={t('accounts.modal.namePlaceholder')}
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('accounts.modal.balance')}
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-amber-600 mt-2">{t('accounts.modal.balanceWarning')}</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('accounts.modal.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
