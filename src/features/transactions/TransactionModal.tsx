/**
 * Modal de Transação
 * Formulário completo para criar/editar transações
 * Suporta: débito, crédito, receita, despesa, transferência e parcelamento
 */

import { Button } from '@/components/ui';
import { db } from '@/core/database';
import { useData } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Account, Category, CostCenter, CreditCard, RecurrenceFrequency, Transaction } from '@/types';
import { Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { buildCreditCardPurchaseInstallments, splitAmountInCents, sumAmountsInCents } from './credit-card-purchase';
import { buildRecurrenceDates, recurrenceForOccurrence, type RecurrenceInput } from './recurrence';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  installmentEditScope?: 'single' | 'all';
  recurrenceEditScope?: 'single' | 'future';
}

const installmentDescriptionSuffix = /\s+\(Parc\. \d+\/\d+\)$/;

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
  recurrenceFrequency: 'none' | RecurrenceFrequency;
  recurrenceDay: string;
  recurrenceEndDate: string;
}

export const TransactionModal = ({
  isOpen,
  onClose,
  transactionToEdit = null,
  installmentEditScope = 'single',
  recurrenceEditScope = 'single',
}: TransactionModalProps) => {
  const { t, formatCurrency } = useI18n();
  const accounts = useData<Account>('accounts');
  const categories = useData<Category>('categories');
  const costCenters = useData<CostCenter>('costCenters');
  const creditCards = useData<CreditCard>('creditCards');
  const transactions = useData<Transaction>('transactions');

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
    recurrenceFrequency: 'none',
    recurrenceDay: '',
    recurrenceEndDate: '',
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (transactionToEdit) {
      const isEditingFullPurchase = transactionToEdit.isCreditCard && installmentEditScope === 'all';
      const purchaseTransactions = isEditingFullPurchase && transactionToEdit.groupId
        ? transactions.filter((transaction) => transaction.groupId === transactionToEdit.groupId)
        : [];
      const recurrence = recurrenceEditScope === 'future' ? transactionToEdit.recurrence : undefined;
      setFormData({
        date: isEditingFullPurchase ? transactionToEdit.purchaseDate ?? transactionToEdit.date : transactionToEdit.date,
        amount: String(isEditingFullPurchase
          ? sumAmountsInCents(purchaseTransactions.map((transaction) => transaction.amount))
          : transactionToEdit.amount),
        description: isEditingFullPurchase
          ? transactionToEdit.description.replace(installmentDescriptionSuffix, '')
          : transactionToEdit.description,
        type: transactionToEdit.type,
        accountId: String(transactionToEdit.accountId || ''),
        toAccountId: String(transactionToEdit.toAccountId || ''),
        categoryId: String(transactionToEdit.categoryId || ''),
        costCenterId: String(transactionToEdit.costCenterId || ''),
        status: transactionToEdit.status,
        paymentMethod: transactionToEdit.isCreditCard ? 'credit' : 'debit',
        creditCardId: String(transactionToEdit.creditCardId || ''),
        installments: transactionToEdit.installmentTotal || 1,
        recurrenceFrequency: recurrence?.frequency ?? 'none',
        recurrenceDay: recurrence?.frequency === 'weekly'
          ? String(recurrence.dayOfWeek)
          : recurrence?.frequency === 'monthly'
            ? String(recurrence.dayOfMonth)
            : '',
        recurrenceEndDate: recurrence?.endDate ?? '',
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
        recurrenceFrequency: 'none',
        recurrenceDay: '',
        recurrenceEndDate: '',
      });
    }
  }, [transactionToEdit, installmentEditScope, recurrenceEditScope, isOpen, accounts, creditCards, transactions]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusDialog = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusDialog);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
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

  const amount = Number(formData.amount) || 0;
  const selectedAccount = accounts.find((account) => account.id === Number(formData.accountId));
  const selectedDestinationAccount = accounts.find((account) => account.id === Number(formData.toAccountId));
  const selectedCard = creditCards.find((card) => card.id === Number(formData.creditCardId));
  const isEditingCreditCardTransaction = Boolean(transactionToEdit?.isCreditCard);
  const isEditingAllInstallments = isEditingCreditCardTransaction && installmentEditScope === 'all';
  const isEditingFutureRecurrence = Boolean(transactionToEdit?.recurrence && recurrenceEditScope === 'future');
  const selectedInstallmentAmounts = splitAmountInCents(amount, formData.installments);
  const primaryInstallmentAmount = selectedInstallmentAmounts[0] ?? 0;
  const lastInstallmentAmount = selectedInstallmentAmounts.at(-1) ?? 0;
  const hasLastInstallmentAdjustment = formData.installments > 1 && primaryInstallmentAmount !== lastInstallmentAmount;
  const installmentOptions = Array.from({ length: 12 }, (_, index) => {
    const installments = index + 1;
    const amounts = splitAmountInCents(amount, installments);
    const amountLabel = formatCurrency(amounts[0] ?? 0);

    return {
      installments,
      label: t('transactions.modal.installmentOption', {
        count: installments,
        label: installments > 1 ? t('transactions.modal.noInterest') : t('transactions.modal.inFull'),
        amount: amountLabel,
      }),
    };
  });

  const getRecurrenceInput = (): RecurrenceInput | null => {
    if (formData.recurrenceFrequency === 'none') return null;
    const day = Number(formData.recurrenceDay);
    if (!formData.recurrenceEndDate || !Number.isInteger(day)) return null;
    return formData.recurrenceFrequency === 'weekly'
      ? {
          frequency: 'weekly',
          startDate: formData.date,
          endDate: formData.recurrenceEndDate,
          dayOfWeek: day,
        }
      : {
          frequency: 'monthly',
          startDate: formData.date,
          endDate: formData.recurrenceEndDate,
          dayOfMonth: day,
        };
  };

  const buildRecurringTransactions = (seriesId: string, recurrenceInput: RecurrenceInput) => {
    const occurrenceDates = buildRecurrenceDates(recurrenceInput);
    const categoryId = formData.categoryId ? Number(formData.categoryId) : null;
    const costCenterId = formData.costCenterId ? Number(formData.costCenterId) : null;

    return occurrenceDates.flatMap((occurrenceDate) => {
      const recurrence = recurrenceForOccurrence(seriesId, recurrenceInput, occurrenceDate);
      if (formData.type === 'expense' && formData.paymentMethod === 'credit') {
        const card = creditCards.find((item) => item.id === Number(formData.creditCardId));
        if (!card) return [];
        return buildCreditCardPurchaseInstallments(card, {
          totalAmount: amount,
          purchaseDate: occurrenceDate,
          description: formData.description,
          installments: formData.installments,
          creditCardId: card.id!,
          groupId: crypto.randomUUID(),
          categoryId,
          costCenterId,
          recurrence,
        });
      }

      return [{
        date: occurrenceDate,
        amount,
        description: formData.description,
        type: formData.type,
        status: 'pending' as const,
        accountId: Number(formData.accountId),
        categoryId,
        costCenterId,
        toAccountId: formData.type === 'transfer' ? Number(formData.toAccountId) : null,
        isCreditCard: false,
        recurrence,
      }];
    });
  };

  const impactPreview = (() => {
    if (transactionToEdit) {
      return t('transactions.impact.edit');
    }
    if (!amount) return t('transactions.impact.empty');
    if (formData.type === 'expense' && formData.paymentMethod === 'credit') {
      return t('transactions.impact.credit', {
        amount: formatCurrency(amount),
        card: selectedCard?.name ?? t('transactions.modal.card'),
        installments: formData.installments,
      });
    }
    if (formData.status === 'pending' || formData.recurrenceFrequency !== 'none') return t('transactions.impact.pending');
    if (!selectedAccount) return t('transactions.impact.selectAccount');
    if (formData.type === 'expense') return t('transactions.impact.expense', { account: selectedAccount.name, amount: formatCurrency(amount) });
    if (formData.type === 'income') return t('transactions.impact.income', { account: selectedAccount.name, amount: formatCurrency(amount) });
    if (!selectedDestinationAccount) return t('transactions.impact.selectDestination');
    return t('transactions.impact.transfer', {
      amount: formatCurrency(amount),
      source: selectedAccount.name,
      destination: selectedDestinationAccount.name,
    });
  })();

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

    const recurrenceInput = getRecurrenceInput();
    if (formData.recurrenceFrequency !== 'none' && (!recurrenceInput || buildRecurrenceDates(recurrenceInput).length === 0)) return;

    try {
      if (isEditingFutureRecurrence && transactionToEdit?.recurrence && recurrenceInput) {
        const transactions = buildRecurringTransactions(transactionToEdit.recurrence.seriesId, recurrenceInput);
        await db.replaceFutureRecurringTransactions(
          transactionToEdit.recurrence.seriesId,
          transactionToEdit.recurrence.occurrenceDate,
          transactions,
        );
      } else if (!transactionToEdit && recurrenceInput) {
        const transactions = buildRecurringTransactions(crypto.randomUUID(), recurrenceInput);
        await db.bulkAdd('transactions', transactions);
      // Lógica para Cartão de Crédito
      } else if (formData.type === 'expense' && formData.paymentMethod === 'credit' && !transactionToEdit) {
        const card = creditCards.find((c) => c.id === Number(formData.creditCardId));
        if (!card) return;

        const groupId = crypto.randomUUID();
        const installments = buildCreditCardPurchaseInstallments(card, {
          totalAmount: amount,
          purchaseDate: formData.date,
          description: formData.description,
          installments: formData.installments,
          creditCardId: Number(formData.creditCardId),
          groupId,
          categoryId: formData.categoryId ? Number(formData.categoryId) : null,
          costCenterId: formData.costCenterId ? Number(formData.costCenterId) : null,
        });
        await db.bulkAdd('transactions', installments);
      } else if (isEditingCreditCardTransaction && transactionToEdit?.id) {
        if (isEditingAllInstallments && transactionToEdit.groupId) {
          const card = creditCards.find((item) => item.id === Number(formData.creditCardId));
          if (!card) return;
          const installments = buildCreditCardPurchaseInstallments(card, {
            totalAmount: amount,
            purchaseDate: formData.date,
            description: formData.description,
            installments: formData.installments,
            creditCardId: Number(formData.creditCardId),
            groupId: transactionToEdit.groupId,
            categoryId: formData.categoryId ? Number(formData.categoryId) : null,
            costCenterId: formData.costCenterId ? Number(formData.costCenterId) : null,
            recurrence: transactionToEdit.recurrence,
          });
          await db.replaceCreditCardPurchase(transactionToEdit.groupId, installments);
        } else {
          const card = creditCards.find((item) => item.id === Number(formData.creditCardId));
          if (!card?.accountId) return;
          await db.updateCreditCardTransaction(transactionToEdit.id, {
            amount,
            creditCardId: Number(formData.creditCardId),
            categoryId: formData.categoryId ? Number(formData.categoryId) : null,
            costCenterId: formData.costCenterId ? Number(formData.costCenterId) : null,
            date: formData.date,
            description: formData.description,
          }, card.accountId);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="transaction-modal-title" onKeyDown={handleDialogKeyDown} className="flex max-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-800 sm:max-h-[90vh] sm:rounded-xl">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
          <h3 id="transaction-modal-title" className="text-lg font-bold text-slate-800 dark:text-white">
            {transactionToEdit ? t('transactions.modal.editTitle') : t('transactions.modal.newTitle')}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        ? 'bg-white dark:bg-slate-600 shadow'
                        : ''
                    } ${
                      tp === 'expense'
                        ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300'
                        : tp === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
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
                {isEditingAllInstallments ? t('transactions.modal.purchaseDate') : t('common.date')}
              </label>
              <input
                type="date"
                required
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {isEditingAllInstallments ? t('transactions.modal.totalAmount') : t('transactions.modal.amount')}
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0,00"
              className="w-full text-lg font-semibold rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border placeholder-slate-400 dark:placeholder-slate-500"
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
              className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border placeholder-slate-400 dark:placeholder-slate-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div aria-live="polite" className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
            <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
            <div>
              <p className="font-semibold">{t('transactions.impact.title')}</p>
              <p>{impactPreview}</p>
            </div>
          </div>

          {/* Seletor de Método de Pagamento (Apenas para Despesas) */}
          {formData.type === 'expense' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('transactions.modal.method')}
                </label>
                <select
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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
                    className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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
                aria-describedby={hasLastInstallmentAdjustment ? 'last-installment-notice' : undefined}
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
              >
                {installmentOptions.map(({ installments, label }) => (
                  <option key={installments} value={installments}>
                    {label}
                  </option>
                ))}
              </select>
              {hasLastInstallmentAdjustment && (
                <p id="last-installment-notice" className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  {t('transactions.modal.lastInstallmentNotice', {
                    amount: formatCurrency(lastInstallmentAmount),
                    total: formatCurrency(amount),
                  })}
                </p>
              )}
            </div>
          )}

          {/* Campos para Transferência e Outros (quando não é cartão) */}
          {formData.type !== 'expense' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('transactions.modal.sourceAccount')}
                </label>
                <select
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('transactions.modal.costCenter')}
              </label>
              <select
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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
            {formData.paymentMethod !== 'credit' && formData.recurrenceFrequency === 'none' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('common.status')}
                </label>
                <select
                  className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
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

          {(!transactionToEdit || isEditingFutureRecurrence) && (
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('transactions.modal.recurrence.label')}
              </label>
              <select
                className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
                value={formData.recurrenceFrequency}
                onChange={(e) => setFormData({
                  ...formData,
                  recurrenceFrequency: e.target.value as FormData['recurrenceFrequency'],
                  recurrenceDay: '',
                  recurrenceEndDate: '',
                })}
              >
                <option value="none">{t('transactions.modal.recurrence.none')}</option>
                <option value="weekly">{t('transactions.modal.recurrence.weekly')}</option>
                <option value="monthly">{t('transactions.modal.recurrence.monthly')}</option>
              </select>

              {formData.recurrenceFrequency !== 'none' && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t(`transactions.modal.recurrence.${formData.recurrenceFrequency === 'weekly' ? 'weekday' : 'monthDay'}`)}
                    </label>
                    <select
                      required
                      className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
                      value={formData.recurrenceDay}
                      onChange={(e) => setFormData({ ...formData, recurrenceDay: e.target.value })}
                    >
                      <option value="">{t('common.select')}</option>
                      {formData.recurrenceFrequency === 'weekly'
                        ? Array.from({ length: 7 }, (_, day) => (
                            <option key={day} value={day}>{t(`transactions.modal.recurrence.weekdays.${day}`)}</option>
                          ))
                        : Array.from({ length: 31 }, (_, index) => (
                            <option key={index + 1} value={index + 1}>{index + 1}</option>
                          ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('transactions.modal.recurrence.endDate')}
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.date}
                      className="w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-2 px-3 border"
                      value={formData.recurrenceEndDate}
                      onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                    />
                  </div>
                </div>
              )}
              {formData.recurrenceFrequency !== 'none' && (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {t('transactions.modal.recurrence.pendingNotice')}
                </p>
              )}
            </div>
          )}

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
