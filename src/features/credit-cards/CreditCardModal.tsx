/**
 * Modal de Cartão de Crédito
 * Formulário para criar/editar cartões de crédito
 */

import { Button } from '@/components/ui';
import { db } from '@/core/database';
import { useData } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Account, CreditCard } from '@/types';
import { X } from 'lucide-react';
import { useState } from 'react';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: CreditCard | null;
}

export const CreditCardModal = ({ isOpen, onClose, cardToEdit = null }: CreditCardModalProps) => {
  const { t } = useI18n();
  const accounts = useData<Account>('accounts');
  const [formData, setFormData] = useState(() => ({
    name: cardToEdit?.name ?? '',
    limit: cardToEdit?.limit ?? 0,
    closingDay: cardToEdit?.closingDay ?? 1,
    dueDay: cardToEdit?.dueDay ?? 10,
    accountId: cardToEdit
      ? cardToEdit.accountId ? String(cardToEdit.accountId) : ''
      : accounts[0]?.id ? String(accounts[0].id) : '',
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.accountId) return;

    try {
      const payload = {
        ...formData,
        limit: parseFloat(String(formData.limit)),
        closingDay: parseInt(String(formData.closingDay)),
        dueDay: parseInt(String(formData.dueDay)),
        accountId: Number(formData.accountId),
      };

      if (cardToEdit?.id) {
        await db.update('creditCards', cardToEdit.id, payload);
      } else {
        await db.add('creditCards', payload);
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
            {cardToEdit ? t('creditCards.modal.editTitle') : t('creditCards.modal.newTitle')}
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
              {t('creditCards.modal.account')}
            </label>
            <select
              required
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
            >
              <option value="">{t('creditCards.modal.selectAccount')}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
            {accounts.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                {t('creditCards.modal.noAccounts')}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('creditCards.modal.name')}
            </label>
            <input
              type="text"
              required
              placeholder={t('creditCards.modal.namePlaceholder')}
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('creditCards.modal.limit')}
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('creditCards.modal.closingDay')}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
                value={formData.closingDay}
                onChange={(e) =>
                  setFormData({ ...formData, closingDay: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('creditCards.modal.dueDay')}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
                value={formData.dueDay}
                onChange={(e) =>
                  setFormData({ ...formData, dueDay: parseInt(e.target.value) || 10 })
                }
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={accounts.length === 0 || !formData.accountId}>
              {t('creditCards.modal.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
