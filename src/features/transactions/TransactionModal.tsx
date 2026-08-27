/**
 * Modal de Transação
 * Formulário completo para criar/editar transações
 * Suporta: débito, crédito, receita, despesa, transferência e parcelamento
 */

import { Button } from '@/components/ui';
import { db } from '@/core/database';
import { useData } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Account, Category, CostCenter, CreditCard, Transaction } from '@/types';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

interface FormData {
  date: string;
  amount: string;
  description: string;
  type: 'expense' | 'income' | 'transfer';
  accountId: string;
  toAccountId: string;
  categoryId: string;
  costCenterId: string;
  status: 'paid' | 'pending';
  paymentMethod: 'debit' | 'credit';
  creditCardId: string;
  installments: number;
}

export const TransactionModal = ({
  isOpen,
  onClose,
  transactionToEdit = null,
}: TransactionModalProps) => {
  const { t } = useI18n();
  const accounts = useData<Account>('accounts');
  const categories = useData<Category>('categories');
  const costCenters = useData<CostCenter>('costCenters');
  const creditCards = useData<CreditCard>('creditCards');

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    type: 'expense',
    accountId: '',
    toAccountId: '',
    categoryId: '',
    costCenterId: '',
    status: 'paid',
    paymentMethod: 'debit',
    creditCardId: '',
    installments: 1,
  });

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        date: transactionToEdit.date,
        amount: String(transactionToEdit.amount),
        description: transactionToEdit.description,
        type: transactionToEdit.type,
        accountId: String(transactionToEdit.accountId || ''),
        toAccountId: String(transactionToEdit.toAccountId || ''),
        categoryId: String(transactionToEdit.categoryId || ''),
        costCenterId: String(transactionToEdit.costCenterId || ''),
        status: transactionToEdit.status,
        paymentMethod: transactionToEdit.isCreditCard ? 'credit' : 'debit',
        creditCardId: String(transactionToEdit.creditCardId || ''),
        installments: transactionToEdit.installmentTotal || 1,
      });
    } else {
      // Reset defaults
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        type: 'expense',
        accountId: accounts[0]?.id ? String(accounts[0].id) : '',
        toAccountId: '',
        categoryId: '',
        costCenterId: '',
        status: 'paid',
        paymentMethod: 'debit',
        creditCardId: creditCards[0]?.id ? String(creditCards[0].id) : '',
        installments: 1,
      });
    }
  }, [transactionToEdit, isOpen, accounts, creditCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);

    if (!amount) return;

    // Validação básica
    if (formData.type === 'expense' && formData.paymentMethod === 'credit') {
      if (!formData.creditCardId || !formData.installments) return;
    } else {
      if (!formData.accountId) return;
    }

    try {
      // Lógica para Cartão de Crédito
      if (formData.type === 'expense' && formData.paymentMethod === 'credit' && !transactionToEdit) {
        const card = creditCards.find((c) => c.id === Number(formData.creditCardId));
        if (!card) return;

        const installments = formData.installments;
        const installmentAmount = amount / installments;
        const purchaseDate = new Date(formData.date);

        // Determinar a data da primeira fatura
        let baseMonth = purchaseDate.getMonth();
        let baseYear = purchaseDate.getFullYear();

        // Se comprou depois ou no dia do fechamento, vai para o próximo mês
        if (purchaseDate.getDate() >= card.closingDay) {
          baseMonth++;
        }

        // Ajuste do ano se passar de dezembro
        if (baseMonth > 11) {
          baseMonth = 0;
          baseYear++;
        }

        let dueMonth = baseMonth;
        const dueYear = baseYear;

        if (card.dueDay < card.closingDay) {
          dueMonth++;
        }

        const groupId = crypto.randomUUID();

        for (let i = 0; i < installments; i++) {
          const finalDueMonth = dueMonth + i;
          const finalDueDate = new Date(dueYear, finalDueMonth, card.dueDay);

          const transData = {
            amount: installmentAmount,
            accountId: null,
            creditCardId: Number(formData.creditCardId),
            date: finalDueDate.toISOString().split('T')[0],
            description: `${formData.description} (Parc. ${i + 1}/${installments})`,
            status: 'pending' as const,
            type: 'expense' as const,
            isCreditCard: true,
            installmentCurrent: i + 1,
            installmentTotal: installments,
            groupId: groupId,
            purchaseDate: formData.date,
            categoryId: formData.categoryId ? Number(formData.categoryId) : null,
            costCenterId: formData.costCenterId ? Number(formData.costCenterId) : null,
          };

          await db.add('transactions', transData);
        }
      } else {
        // Lógica Original (Débito / Receita / Transferência)
        const transData: Partial<Transaction> = {
          date: formData.date,
          amount: amount,
          description: formData.description,
          type: formData.type,
          status: formData.status,
          accountId: Number(formData.accountId),
          categoryId: formData.categoryId ? Number(formData.categoryId) : null,
          costCenterId: formData.costCenterId ? Number(formData.costCenterId) : null,
          toAccountId: formData.type === 'transfer' ? Number(formData.toAccountId) : null,
          isCreditCard: false,
        };

        if (transactionToEdit?.id) {
          await db.update('transactions', transactionToEdit.id, transData);
        } else {
          await db.add('transactions', transData);

          // Atualizar Saldos (apenas se pago e não for cartão)
          if (formData.status === 'paid') {
            const account = await db.get<Account>('accounts', Number(formData.accountId));

            if (account) {
              if (formData.type === 'expense') {
                await db.update('accounts', Number(formData.accountId), {
                  balance: account.balance - amount,
                });
              } else if (formData.type === 'income') {
                await db.update('accounts', Number(formData.accountId), {
                  balance: account.balance + amount,
                });
              } else if (formData.type === 'transfer' && formData.toAccountId) {
                const toAccount = await db.get<Account>('accounts', Number(formData.toAccountId));
                if (toAccount) {
                  await db.update('accounts', Number(formData.accountId), {
                    balance: account.balance - amount,
                  });
                  await db.update('accounts', Number(formData.toAccountId), {
                    balance: toAccount.balance + amount,
                  });
                }
              }
            }
          }
        }
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {transactionToEdit ? t('transactions.modal.editTitle') : t('transactions.modal.newTitle')}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('common.type')}
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
                {(['expense', 'income', 'transfer'] as const).map((tp) => (
                  <button
                    type="button"
                    key={tp}
                    onClick={() => setFormData({ ...formData, type: tp })}
                    className={`flex-1 text-sm py-1.5 rounded-md capitalize font-medium transition-all ${
                      formData.type === tp
                        ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {t(`transactions.types.${tp}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('common.date')}
              </label>
              <input
                type="date"
                required
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('transactions.modal.amount')}
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              className="w-full text-lg font-semibold rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border placeholder-slate-400 dark:placeholder-slate-500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('common.description')}
            </label>
            <input
              type="text"
              required
              placeholder={t('transactions.modal.descriptionPlaceholder')}
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border placeholder-slate-400 dark:placeholder-slate-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Seletor de Método de Pagamento (Apenas para Despesas) */}
          {formData.type === 'expense' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('transactions.modal.method')}
                </label>
                <select
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value as 'debit' | 'credit' })
                  }
                >
                  <option value="debit">{t('transactions.modal.paymentMethods.debit')}</option>
                  <option value="credit">{t('transactions.modal.paymentMethods.credit')}</option>
                </select>
              </div>

              {formData.paymentMethod === 'credit' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('transactions.modal.card')}
                  </label>
                  <select
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                    value={formData.creditCardId}
                    onChange={(e) => setFormData({ ...formData, creditCardId: e.target.value })}
                    required
                  >
                    <option value="">{t('transactions.modal.selectCard')}</option>
                    {creditCards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('transactions.modal.sourceAccount')}
                  </label>
                  <select
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    required
                  >
                    <option value="">{t('common.select')}</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Campos Específicos de Cartão de Crédito */}
          {formData.type === 'expense' && formData.paymentMethod === 'credit' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('transactions.modal.installments')}
              </label>
              <select
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>
                    {n}x {n > 1 ? t('transactions.modal.noInterest') : t('transactions.modal.inFull')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campos para Transferência e Outros (quando não é cartão) */}
          {formData.type !== 'expense' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('transactions.modal.sourceAccount')}
                </label>
                <select
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  required
                >
                  <option value="">{t('common.select')}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.type === 'transfer' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('transactions.modal.destinationAccount')}
              </label>
              <select
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                value={formData.toAccountId}
                onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                required
              >
                <option value="">{t('common.select')}</option>
                {accounts
                  .filter((a) => String(a.id) !== formData.accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('transactions.modal.category')}
              </label>
              <select
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Sem categoria</option>
                {categories
                  .filter((c) => c.type === formData.type)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('transactions.modal.costCenter')}
              </label>
              <select
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                value={formData.costCenterId}
                onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
              >
                <option value="">{t('transactions.modal.general')}</option>
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status só aparece se não for cartão de crédito */}
            {formData.paymentMethod !== 'credit' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('common.status')}
                </label>
                <select
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3 border"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as 'paid' | 'pending' })
                  }
                >
                  <option value="paid">{t('transactions.status.paid')}</option>
                  <option value="pending">{t('transactions.status.pending')}</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('transactions.modal.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
