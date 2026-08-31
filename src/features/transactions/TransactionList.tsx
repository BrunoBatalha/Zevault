/**
 * Lista de Transações
 * Exibe transações com três modos de visualização:
 * - list: Lista completa
 * - monthly: Agrupado por mês
 * - single-month: Mês específico
 */

import { ConfirmationModal, DeleteInstallmentModal, EditInstallmentModal } from '@/components/shared';
import { Badge, Button, Card } from '@/components/ui';
import { db } from '@/core/database';
import { useData } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import type { Account, Category, CreditCard, Transaction } from '@/types';
import {
    ArrowLeftRight,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CreditCard as CreditCardIcon,
    Edit2,
    List,
    MoreVertical,
    Plus,
    Repeat,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { TransactionModal } from './TransactionModal';

type ViewMode = 'list' | 'monthly' | 'single-month';
type MenuPosition = { top: number; left: number };

export const TransactionList = () => {
  const { t, formatCurrency } = useI18n();
  const transactions = useData<Transaction>('transactions');
  const accounts = useData<Account>('accounts');
  const categories = useData<Category>('categories');
  const creditCards = useData<CreditCard>('creditCards');

  const [showModal, setShowModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<Transaction | null>(null);
  const [showInstallmentEditModal, setShowInstallmentEditModal] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState<Transaction | null>(null);
  const [installmentEditScope, setInstallmentEditScope] = useState<'single' | 'all'>('single');
  const [recurrenceEditScope, setRecurrenceEditScope] = useState<'single' | 'future'>('single');
  const [recurrenceAction, setRecurrenceAction] = useState<{ transaction: Transaction; type: 'edit' | 'delete' } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const [transactionForStatusChange, setTransactionForStatusChange] = useState<Transaction | null>(null);

  // Filtros e Busca
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesMonth =
        viewMode === 'list' || t.date.startsWith(selectedMonth);
      return matchesSearch && matchesType && matchesStatus && matchesMonth;
    });
  }, [transactions, searchTerm, filterType, filterStatus, viewMode, selectedMonth]);

  // Agrupamento mensal
  const transactionsByMonth = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(t);
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  // Calcular totais do mês selecionado
  const monthTotals = useMemo(() => {
    const monthTransactions = transactions.filter((t) =>
      t.date.startsWith(selectedMonth)
    );
    return {
      income: monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      expense: monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
      pending: monthTransactions
        .filter((t) => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions, selectedMonth]);

  const editOnlyThis = (transaction: Transaction) => {
    if (transaction.groupId) {
      setInstallmentToEdit(transaction);
      setShowInstallmentEditModal(true);
      setOpenMenuId(null);
      return;
    }
    setTransactionToEdit(transaction);
    setInstallmentEditScope('single');
    setRecurrenceEditScope('single');
    setShowModal(true);
    setOpenMenuId(null);
  };

  const deleteOnlyThis = (transaction: Transaction) => {
    if (transaction.groupId) {
      setInstallmentToDelete(transaction);
      setShowInstallmentModal(true);
    } else {
      setTransactionToDelete(transaction);
      setShowDeleteModal(true);
    }
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete?.id) return;

    try {
      if (transactionToDelete.isCreditCard) {
        await db.deleteCreditCardTransactions([transactionToDelete.id]);
      } else {
        // Reverter saldo se necessário
        if (transactionToDelete.status === 'paid') {
          const account = await db.get<Account>('accounts', transactionToDelete.accountId!);
          if (account) {
            let newBalance = account.balance;
            if (transactionToDelete.type === 'expense') {
              newBalance += transactionToDelete.amount;
            } else if (transactionToDelete.type === 'income') {
              newBalance -= transactionToDelete.amount;
            }
            await db.update('accounts', transactionToDelete.accountId!, { balance: newBalance });
          }
        }
        await db.delete('transactions', transactionToDelete.id);
      }
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
    }
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  const handleInstallmentDelete = async (mode: 'single' | 'remaining' | 'all') => {
    if (!installmentToDelete?.groupId) return;

    try {
      const allTransactions = await db.getAll<Transaction>('transactions');
      const group = allTransactions.filter((t) => t.groupId === installmentToDelete.groupId);

      const selectedTransactions = mode === 'single'
        ? [installmentToDelete]
        : mode === 'remaining'
          ? group.filter((t) => t.installmentCurrent! >= installmentToDelete.installmentCurrent!)
          : group;
      await db.deleteCreditCardTransactions(
        selectedTransactions.flatMap((transaction) => transaction.id === undefined ? [] : [transaction.id]),
      );
    } catch (err) {
      console.error('Erro ao excluir parcelas:', err);
    }

    setShowInstallmentModal(false);
    setInstallmentToDelete(null);
  };

  const requestStatusChange = (transaction: Transaction) => {
    setTransactionForStatusChange(transaction);
    setOpenMenuId(null);
  };

  const handleEdit = (transaction: Transaction) => {
    if (transaction.recurrence) {
      setRecurrenceAction({ transaction, type: 'edit' });
      setOpenMenuId(null);
      return;
    }
    editOnlyThis(transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    if (transaction.recurrence) {
      setRecurrenceAction({ transaction, type: 'delete' });
      setOpenMenuId(null);
      return;
    }
    deleteOnlyThis(transaction);
  };

  const resolveRecurrenceAction = async (scope: 'single' | 'future') => {
    if (!recurrenceAction) return;
    const { transaction, type } = recurrenceAction;
    setRecurrenceAction(null);
    if (scope === 'single') {
      if (type === 'edit') editOnlyThis(transaction);
      else deleteOnlyThis(transaction);
      return;
    }

    if (type === 'edit') {
      setTransactionToEdit(transaction);
      setInstallmentEditScope('single');
      setRecurrenceEditScope('future');
      setShowModal(true);
      return;
    }

    try {
      await db.deleteFutureRecurringTransactions(
        transaction.recurrence!.seriesId,
        transaction.recurrence!.occurrenceDate,
      );
    } catch (err) {
      console.error('Erro ao excluir recorrência:', err);
    }
  };

  const confirmInstallmentEdit = (scope: 'single' | 'all') => {
    if (!installmentToEdit) return;
    setTransactionToEdit(installmentToEdit);
    setInstallmentEditScope(scope);
    setInstallmentToEdit(null);
    setShowInstallmentEditModal(false);
    setShowModal(true);
  };

  const confirmStatusChange = async () => {
    if (!transactionForStatusChange) return;
    const transaction = transactionForStatusChange;
    const newStatus = transaction.status === 'paid' ? 'pending' : 'paid';
    const card = transaction.isCreditCard
      ? creditCards.find((item) => item.id === transaction.creditCardId)
      : undefined;
    if (transaction.isCreditCard && newStatus === 'paid' && !card?.accountId) {
      setTransactionForStatusChange(null);
      return;
    }
    try {
      if (transaction.isCreditCard) {
        await db.changeCreditCardTransactionStatus(
          transaction.id!,
          newStatus,
          newStatus === 'paid' ? card?.accountId ?? undefined : undefined,
        );
      } else {
        await db.update('transactions', transaction.id!, { status: newStatus });

        // Atualizar saldos para transações comuns. Transferências afetam origem e destino.
        if (transaction.accountId !== null && transaction.accountId !== undefined) {
          const account = await db.get<Account>('accounts', transaction.accountId);
          if (account && transaction.type === 'transfer' && transaction.toAccountId !== null && transaction.toAccountId !== undefined) {
            const toAccount = await db.get<Account>('accounts', transaction.toAccountId);
            if (toAccount) {
              const direction = newStatus === 'paid' ? 1 : -1;
              await db.update('accounts', transaction.accountId, {
                balance: account.balance - transaction.amount * direction,
              });
              await db.update('accounts', transaction.toAccountId, {
                balance: toAccount.balance + transaction.amount * direction,
              });
            }
          } else if (account) {
            const delta = transaction.type === 'expense' ? -transaction.amount : transaction.amount;
            const adjust = newStatus === 'paid' ? delta : -delta;
            await db.update('accounts', transaction.accountId, {
              balance: account.balance + adjust,
            });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
    setTransactionForStatusChange(null);
  };

  const getAccountName = (id: number | null | undefined) => {
    if (!id) return '-';
    return accounts.find((a) => a.id === id)?.name || '-';
  };

  const getCategoryName = (id: number | null) => {
    if (!id) return 'Sem categoria';
    return categories.find((c) => c.id === id)?.name || 'Sem categoria';
  };

  const getCreditCardName = (id: number | null) => {
    if (!id) return '-';
    return creditCards.find((c) => c.id === id)?.name || '-';
  };

  const getStatusChangeMessage = (transaction: Transaction) => {
    const isMarkingPaid = transaction.status === 'pending';
    const amount = formatCurrency(transaction.amount);

    if (transaction.isCreditCard) {
      const card = creditCards.find((item) => item.id === transaction.creditCardId);
      if (isMarkingPaid && !card?.accountId) return t('transactions.statusChange.creditCardMissingAccount');
      const account = isMarkingPaid
        ? getAccountName(card?.accountId)
        : getAccountName(transaction.accountId);
      return t(isMarkingPaid ? 'transactions.statusChange.payCreditCard' : 'transactions.statusChange.revertCreditCard', { account, amount });
    }

    const account = getAccountName(transaction.accountId);
    if (transaction.type === 'expense') {
      return t(isMarkingPaid ? 'transactions.statusChange.payExpense' : 'transactions.statusChange.revertExpense', { account, amount });
    }
    if (transaction.type === 'income') {
      return t(isMarkingPaid ? 'transactions.statusChange.payIncome' : 'transactions.statusChange.revertIncome', { account, amount });
    }
    const destination = getAccountName(transaction.toAccountId);
    return t(isMarkingPaid ? 'transactions.statusChange.payTransfer' : 'transactions.statusChange.revertTransfer', { source: account, destination, amount });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-rose-500" />;
      case 'transfer':
        return <ArrowLeftRight className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const toggleActionsMenu = (transactionId: number, button: HTMLButtonElement) => {
    if (openMenuId === transactionId) {
      setOpenMenuId(null);
      setMenuPosition(null);
      return;
    }

    const buttonRect = button.getBoundingClientRect();
    const menuWidth = 192;
    const estimatedMenuHeight = 132;
    const viewportPadding = 8;
    const left = Math.min(
      Math.max(viewportPadding, buttonRect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding
    );
    const top = buttonRect.bottom + estimatedMenuHeight + viewportPadding <= window.innerHeight
      ? buttonRect.bottom + 4
      : Math.max(viewportPadding, buttonRect.top - estimatedMenuHeight - 4);

    setMenuPosition({ top, left });
    setOpenMenuId(transactionId);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
    setSelectedMonth(date.toISOString().substring(0, 7));
  };

  const formatMonthYear = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const renderTransactionRow = (transaction: Transaction) => (
    <tr
      key={transaction.id}
      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
            {transaction.isCreditCard ? (
              <CreditCardIcon className="w-4 h-4 text-emerald-500" />
            ) : (
              getTypeIcon(transaction.type)
            )}
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-white text-sm">
              {transaction.description}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {transaction.isCreditCard
                ? getCreditCardName(transaction.creditCardId!)
                : getAccountName(transaction.accountId!)}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
        {getCategoryName(transaction.categoryId ?? null)}
      </td>
      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
        {new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}
      </td>
      <td className="py-3 px-4">
        <span
          className={`font-semibold text-sm ${
            transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </span>
        {transaction.installmentTotal && transaction.installmentTotal > 1 && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
            <Repeat className="w-3 h-3" />
            <span>
              {transaction.installmentCurrent}/{transaction.installmentTotal}
            </span>
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <Badge variant={transaction.status === 'paid' ? 'success' : 'warning'}>
          {t(`transactions.status.${transaction.status}`)}
        </Badge>
      </td>
      <td className="py-3 px-4 text-right relative">
        <button
          type="button"
          aria-label={t('common.actions')}
          aria-haspopup="menu"
          aria-expanded={openMenuId === transaction.id}
          onClick={(event) => toggleActionsMenu(transaction.id!, event.currentTarget)}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          <MoreVertical className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
        {openMenuId === transaction.id && menuPosition && createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setOpenMenuId(null);
                setMenuPosition(null);
              }}
            />
            <div
              role="menu"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              className="fixed z-50 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => requestStatusChange(transaction)}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                {transaction.status === 'paid' ? (
                  <>
                    <XCircle className="w-4 h-4 text-amber-500" />
                    {t('transactions.actions.markPending')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {t('transactions.actions.markPaid')}
                  </>
                )}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleEdit(transaction)}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <Edit2 className="w-4 h-4 text-blue-500" />
                {t('common.edit')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleDelete(transaction)}
                className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </button>
            </div>
          </>,
          document.body
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {t('transactions.title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t('transactions.subtitle')}
          </p>
        </div>
        <Button onClick={() => {
          setTransactionToEdit(null);
          setShowModal(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          {t('transactions.new')}
        </Button>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('transactions.search')}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro de Tipo */}
            <select
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">{t('transactions.filters.allTypes')}</option>
              <option value="income">{t('transactions.types.income')}</option>
              <option value="expense">{t('transactions.types.expense')}</option>
              <option value="transfer">{t('transactions.types.transfer')}</option>
            </select>

            {/* Filtro de Status */}
            <select
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t('transactions.filters.allStatus')}</option>
              <option value="paid">{t('transactions.status.paid')}</option>
              <option value="pending">{t('transactions.status.pending')}</option>
            </select>

            {/* Toggle de Visualização */}
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-600 shadow text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`p-2 rounded-md ${
                  viewMode === 'monthly'
                    ? 'bg-white dark:bg-slate-600 shadow text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navegador de Mês (quando em modo single-month ou monthly) */}
          {(viewMode === 'monthly' || viewMode === 'single-month') && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
                <span className="font-medium text-slate-800 dark:text-white capitalize min-w-[150px] text-center">
                  {formatMonthYear(selectedMonth)}
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <div className="flex gap-4 text-sm">
                <span className="text-emerald-600">
                  {t('dashboard.income')}: {formatCurrency(monthTotals.income)}
                </span>
                <span className="text-rose-600">
                  {t('dashboard.expenses')}: {formatCurrency(monthTotals.expense)}
                </span>
                <span className="text-amber-600">
                  {t('transactions.pending')}: {formatCurrency(monthTotals.pending)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <div className="overflow-x-auto">
          {viewMode === 'monthly' ? (
            // Visão Agrupada por Mês
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {transactionsByMonth.map(([month, monthTransactions]) => (
                <div key={month} className="p-4">
                  <button
                    onClick={() => {
                      setSelectedMonth(month);
                      setViewMode('single-month');
                    }}
                    className="w-full text-left mb-3 flex items-center justify-between group"
                  >
                    <h3 className="font-semibold text-slate-800 dark:text-white capitalize group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {formatMonthYear(month)}
                    </h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {monthTransactions.length} {t('transactions.transactionsCount')}
                    </span>
                  </button>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <tbody>
                        {[...monthTransactions]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(renderTransactionRow)}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600">
                      +
                      {formatCurrency(
                        monthTransactions
                          .filter((t) => t.type === 'income')
                          .reduce((s, t) => s + t.amount, 0)
                      )}
                    </span>
                    <span className="text-rose-600">
                      -
                      {formatCurrency(
                        monthTransactions
                          .filter((t) => t.type === 'expense')
                          .reduce((s, t) => s + t.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Visão de Lista
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('common.description')}
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('transactions.category')}
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('common.date')}
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('transactions.modal.amount')}
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                      {t('transactions.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(renderTransactionRow)
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modais */}
      <TransactionModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setTransactionToEdit(null);
          setRecurrenceEditScope('single');
        }}
        transactionToEdit={transactionToEdit}
        installmentEditScope={installmentEditScope}
        recurrenceEditScope={recurrenceEditScope}
      />

      {recurrenceAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="recurrence-action-title">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800">
            <h3 id="recurrence-action-title" className="text-lg font-bold text-slate-800 dark:text-white">
              {t('transactions.modal.recurrence.actionTitle')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t(`transactions.modal.recurrence.${recurrenceAction.type === 'edit' ? 'editMessage' : 'deleteMessage'}`)}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" type="button" onClick={() => setRecurrenceAction(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="secondary" type="button" onClick={() => void resolveRecurrenceAction('single')}>
                {t('transactions.modal.recurrence.onlyThis')}
              </Button>
              <Button type="button" onClick={() => void resolveRecurrenceAction('future')}>
                {t('transactions.modal.recurrence.thisAndFuture')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={t('transactions.deleteModal.title')}
        message={t('transactions.deleteModal.message')}
      />

      <ConfirmationModal
        isOpen={Boolean(transactionForStatusChange)}
        onClose={() => setTransactionForStatusChange(null)}
        onConfirm={confirmStatusChange}
        title={t(`transactions.statusChange.title.${transactionForStatusChange?.status === 'pending' ? 'paid' : 'pending'}`)}
        message={transactionForStatusChange ? getStatusChangeMessage(transactionForStatusChange) : ''}
        confirmText={transactionForStatusChange?.isCreditCard && transactionForStatusChange.status === 'pending' && !creditCards.find((card) => card.id === transactionForStatusChange.creditCardId)?.accountId
          ? t('common.close')
          : t(`transactions.actions.${transactionForStatusChange?.status === 'pending' ? 'markPaid' : 'markPending'}`)}
        isDanger={false}
        showCancel={!(transactionForStatusChange?.isCreditCard && transactionForStatusChange.status === 'pending' && !creditCards.find((card) => card.id === transactionForStatusChange.creditCardId)?.accountId)}
      />

      <DeleteInstallmentModal
        isOpen={showInstallmentModal}
        onClose={() => setShowInstallmentModal(false)}
        onConfirm={handleInstallmentDelete}
      />

      <EditInstallmentModal
        isOpen={showInstallmentEditModal}
        onClose={() => {
          setShowInstallmentEditModal(false);
          setInstallmentToEdit(null);
        }}
        onConfirm={confirmInstallmentEdit}
      />
    </div>
  );
};
