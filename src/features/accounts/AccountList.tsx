/**
 * Lista de Contas
 * Exibe e gerencia contas bancárias (CRUD)
 */

import { ConfirmationModal } from '@/components/shared';
import { Badge, Button, Card } from '@/components/ui';
import { db } from '@/core/database';
import { useData } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Account, CreditCard } from '@/types';
import { Landmark, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AccountModal } from './AccountModal';

export const AccountList = () => {
  const { t, formatCurrency } = useI18n();
  const accounts = useData<Account>('accounts');
  const creditCards = useData<CreditCard>('creditCards');
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // State for Custom Confirmation Modal
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [linkedAccountName, setLinkedAccountName] = useState<string | null>(null);

  const initiateDelete = (id: number) => {
    const linkedCard = creditCards.find((card) => card.accountId === id);
    if (linkedCard) {
      setLinkedAccountName(linkedCard.name);
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.delete('accounts', deleteId);
      } catch (err) {
        console.error('Erro ao excluir conta:', err);
      }
      setDeleteId(null);
    }
  };

  const openEdit = (acc: Account) => {
    setEditingAccount(acc);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t('accounts.searchPlaceholder')}
            className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button onClick={openNew} icon={Plus}>
          {t('accounts.newAccount')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((acc) => (
          <Card
            key={acc.id}
            className="p-6 relative group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
          >
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                type="button"
                aria-label={t('common.edit')}
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(acc);
                }}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-100 dark:border-slate-700"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label={t('common.delete')}
                onClick={(e) => {
                  e.stopPropagation();
                  if (acc.id) initiateDelete(acc.id);
                }}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-100 dark:border-slate-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">{acc.name}</h4>
                <Badge variant="bank">{t('accounts.badge')}</Badge>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
                {t('accounts.currentBalance')}
              </p>
              <p
                className={`text-2xl font-bold ${
                  acc.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(acc.balance)}
              </p>
            </div>
          </Card>
        ))}

        {/* Empty State / Add New Card */}
        {filteredAccounts.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            {t('accounts.emptyState')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <AccountModal
          isOpen
          onClose={() => setIsModalOpen(false)}
          accountToEdit={editingAccount}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('accounts.deleteTitle')}
        message={t('accounts.deleteMessage')}
      />

      <ConfirmationModal
        isOpen={Boolean(linkedAccountName)}
        onClose={() => setLinkedAccountName(null)}
        onConfirm={() => setLinkedAccountName(null)}
        title={t('accounts.linkedDeleteTitle')}
        message={t('accounts.linkedDeleteMessage', { card: linkedAccountName })}
        confirmText={t('common.close')}
        isDanger={false}
        showCancel={false}
      />
    </div>
  );
};
