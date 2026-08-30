/**
 * Lista de Cartões de Crédito
 * Exibe e gerencia cartões de crédito (CRUD)
 */

import { ConfirmationModal } from '@/components/shared';
import { Badge, Button, Card } from '@/components/ui';
import { db } from '@/core/database';
import { useData } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Account, CreditCard as CreditCardType } from '@/types';
import { CreditCard, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CreditCardModal } from './CreditCardModal';

export const CreditCardList = () => {
  const { t, formatCurrency } = useI18n();
  const cards = useData<CreditCardType>('creditCards');
  const accounts = useData<Account>('accounts');
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const initiateDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.delete('creditCards', deleteId);
      } catch (err) {
        console.error('Erro ao excluir cartão:', err);
      }
      setDeleteId(null);
    }
  };

  const openEdit = (card: CreditCardType) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const filteredCards = cards.filter((card) =>
    card.name.toLowerCase().includes(filter.toLowerCase())
  );
  const getAccountName = (accountId: number | null) =>
    accounts.find((account) => account.id === accountId)?.name;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={t('creditCards.searchPlaceholder')}
            className="pl-10 pr-4 py-2 w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-400 dark:placeholder-slate-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Button onClick={openNew} icon={Plus}>
          {t('creditCards.newCard')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <Card
            key={card.id}
            className="p-6 relative group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
          >
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                type="button"
                aria-label={t('common.edit')}
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(card);
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
                  if (card.id) initiateDelete(card.id);
                }}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-100 dark:border-slate-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">{card.name}</h4>
                <Badge variant="card">{t('creditCards.badge')}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('creditCards.account')}</span>
                <span className={`font-medium ${card.accountId ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}`}>
                  {getAccountName(card.accountId) ?? t('creditCards.unlinkedAccount')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('creditCards.limit')}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(card.limit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('creditCards.closingDay')}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t('dates.day', { day: card.closingDay })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">{t('creditCards.dueDay')}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {t('dates.day', { day: card.dueDay })}
                </span>
              </div>
            </div>
          </Card>
        ))}

        {filteredCards.length === 0 && (
          <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            {t('creditCards.emptyState')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <CreditCardModal
          isOpen
          onClose={() => setIsModalOpen(false)}
          cardToEdit={editingCard}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('creditCards.deleteTitle')}
        message={t('creditCards.deleteMessage')}
      />
    </div>
  );
};
