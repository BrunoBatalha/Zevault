import { Badge, Button, Card } from '@/components/ui';
import { useData, useTheme } from '@/core/hooks';
import { useI18n } from '@/core/i18n';
import { TransactionModal } from '@/features/transactions';
import type { Account, Category, CreditCard, Transaction } from '@/types';
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarClock, CircleDollarSign, Clock3, Plus, ReceiptText, ShieldCheck, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { buildCashFlowLast30Days, buildDashboardSummary, getPendingCommitments, type CommitmentPeriod } from './dashboard-data';
import { buildFutureExpensesChart } from './future-expenses';

interface DashboardProps { userName?: string }

const summaryCards = [
  { key: 'totalBalance', icon: Wallet, tone: 'text-slate-950 dark:text-white', iconTone: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  { key: 'committed', icon: CalendarClock, tone: 'text-amber-700 dark:text-amber-300', iconTone: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { key: 'availableAfterCommitments', icon: ShieldCheck, tone: 'text-emerald-700 dark:text-emerald-300', iconTone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
] as const;

function parseTransactionDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const Dashboard = ({ userName }: DashboardProps) => {
  const { t, formatCurrency, formatDate, formatMonthYear, formatRelativeTime } = useI18n();
  const { theme } = useTheme();
  const transactions = useData<Transaction>('transactions');
  const accounts = useData<Account>('accounts');
  const categories = useData<Category>('categories');
  const creditCards = useData<CreditCard>('creditCards');
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [commitmentPeriod, setCommitmentPeriod] = useState<CommitmentPeriod>(7);
  const today = useMemo(() => new Date(), []);
  const isDark = theme === 'dark';

  const summary = useMemo(() => buildDashboardSummary(accounts, transactions, today), [accounts, today, transactions]);
  const cashFlow = useMemo(() => buildCashFlowLast30Days(transactions, today), [today, transactions]);
  const commitments = useMemo(() => getPendingCommitments(transactions, today, commitmentPeriod).slice(0, 6), [commitmentPeriod, today, transactions]);
  const recentTransactions = useMemo(() => [...transactions].sort((a, b) => b.date.localeCompare(a.date) || Number(b.id ?? 0) - Number(a.id ?? 0)).slice(0, 6), [transactions]);
  const futureExpensesChart = useMemo(() => buildFutureExpensesChart(transactions, categories, today, t('dashboard.uncategorized')), [categories, t, today, transactions]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account.name])), [accounts]);
  const cardById = useMemo(() => new Map(creditCards.map((card) => [card.id, card.name])), [creditCards]);
  const chartGrid = isDark ? '#334155' : '#e2e8f0';
  const tooltipStyle = { borderRadius: '12px', border: `1px solid ${chartGrid}`, backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a' };
  const flowTotals = cashFlow.reduce((totals, day) => ({ income: totals.income + day.income, expense: totals.expense + day.expense }), { income: 0, expense: 0 });
  const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const getSourceName = (transaction: Transaction) => transaction.isCreditCard
    ? cardById.get(transaction.creditCardId ?? undefined) ?? t('creditCards.label')
    : accountById.get(transaction.accountId ?? undefined) ?? t('dashboard.noAccount');

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{userName ? t('dashboard.greeting', { name: userName }) : t('dashboard.overview')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{t('dashboard.financialOverview')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{t('dashboard.financialOverviewDescription')}</p>
        </div>
        <Button onClick={() => setTransactionModalOpen(true)} className="min-h-11 w-full sm:w-auto"><Plus aria-hidden="true" className="mr-2 h-4 w-4" />{t('dashboard.newTransaction')}</Button>
      </header>

      <section aria-labelledby="financial-summary-title">
        <h2 id="financial-summary-title" className="sr-only">{t('dashboard.summaryTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map(({ key, icon: Icon, tone, iconTone }) => (
            <Card key={key} className="p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t(`dashboard.summary.${key}.label`)}</p><p className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${tone}`}>{formatCurrency(summary[key])}</p></div>
                <span className={`rounded-xl p-2.5 ${iconTone}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{t(`dashboard.summary.${key}.description`)}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('dashboard.cashFlow')}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.cashFlowDescription')}</p></div><Badge>{t('dates.last30Days')}</Badge></div>
          <p className="sr-only">{t('dashboard.cashFlowSummary', { income: formatCurrency(flowTotals.income), expense: formatCurrency(flowTotals.expense), net: formatCurrency(flowTotals.income - flowTotals.expense) })}</p>
          <div className="mt-5 h-72 w-full overflow-hidden" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><BarChart data={cashFlow} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} /><XAxis dataKey="date" tickFormatter={(date) => date.slice(8)} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} interval={4} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={58} /><RechartsTooltip contentStyle={tooltipStyle} labelFormatter={(date) => formatDate(String(date))} formatter={(value) => formatCurrency(Number(value))} /><Legend /><Bar dataKey="income" name={t('dashboard.income')} fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={18} /><Bar dataKey="expense" name={t('dashboard.expenses')} fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={18} /></BarChart></ResponsiveContainer></div>
        </Card>

        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('dashboard.attention.title')}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.attention.description')}</p></div><AlertCircle aria-hidden="true" className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/30"><p className="text-2xl font-bold text-rose-800 dark:text-rose-300">{summary.overdueCount}</p><p className="text-sm text-rose-700 dark:text-rose-300">{t('dashboard.attention.overdue', { count: summary.overdueCount })}</p></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30"><p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{summary.dueSoonCount}</p><p className="text-sm text-amber-700 dark:text-amber-300">{t('dashboard.attention.dueSoon', { count: summary.dueSoonCount })}</p></div>
            {summary.nextCommitment ? <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('dashboard.attention.next')}</p><div className="mt-2 flex items-end justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-900 dark:text-white">{summary.nextCommitment.description}</p><p className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(summary.nextCommitment.date)} · {formatDate(summary.nextCommitment.date)}</p></div><p className="shrink-0 font-bold text-slate-900 dark:text-white">{formatCurrency(summary.nextCommitment.amount)}</p></div></div> : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{t('dashboard.attention.empty')}</p>}
          </div>
          <Link to="/transactions" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600 dark:text-emerald-300">{t('dashboard.viewPending')}<ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
        </Card>
      </div>

      <Card className="p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('dashboard.commitments.title')}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.commitments.description')}</p></div><div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900" aria-label={t('dashboard.commitments.periodLabel')}>{([7, 30, 'all'] as CommitmentPeriod[]).map((period) => <button key={period} type="button" onClick={() => setCommitmentPeriod(period)} aria-pressed={commitmentPeriod === period} className={`min-h-11 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors sm:flex-none ${commitmentPeriod === period ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>{t(`dashboard.commitments.period.${period}`)}</button>)}</div></div>
        {commitments.length === 0 ? <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700"><CircleDollarSign aria-hidden="true" className="h-8 w-8 text-slate-400" /><p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">{t('dashboard.commitments.emptyTitle')}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('dashboard.commitments.emptyDescription')}</p></div> : <ul className="mt-5 divide-y divide-slate-200 dark:divide-slate-700">{commitments.map((transaction) => {
          const overdue = parseTransactionDate(transaction.date) < todayAtStart;
          return <li key={transaction.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${overdue ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>{overdue ? <AlertCircle aria-hidden="true" className="h-5 w-5" /> : <Clock3 aria-hidden="true" className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900 dark:text-white">{transaction.description}</p><Badge variant={overdue ? 'danger' : 'warning'}>{overdue ? t('dashboard.commitments.overdue') : t('transactions.status.pending')}</Badge></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{categoryById.get(transaction.categoryId ?? undefined) ?? t('dashboard.uncategorized')} · {formatDate(transaction.date)} · {getSourceName(transaction)}</p></div><p className="text-lg font-bold text-slate-950 dark:text-white">{formatCurrency(transaction.amount)}</p></li>;
        })}</ul>}
        <Link to="/transactions" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300">{t('dashboard.commitments.viewAll')}<ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('dashboard.recentTransactions')}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.recentDescription')}</p></div><ReceiptText aria-hidden="true" className="h-5 w-5 text-slate-400" /></div>
          {recentTransactions.length === 0 ? <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700"><p className="font-semibold text-slate-800 dark:text-slate-200">{t('dashboard.noTransactions')}</p><button type="button" onClick={() => setTransactionModalOpen(true)} className="mt-2 min-h-11 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('dashboard.createFirstTransaction')}</button></div> : <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">{recentTransactions.map((transaction) => <li key={transaction.id} className="flex items-center gap-3 py-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${transaction.type === 'income' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : transaction.type === 'expense' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>{transaction.type === 'income' ? <ArrowUpRight aria-hidden="true" className="h-4 w-4" /> : <ArrowDownRight aria-hidden="true" className="h-4 w-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{transaction.description}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{formatDate(transaction.date)} · {getSourceName(transaction)}</p></div><div className="text-right"><p className={`text-sm font-bold ${transaction.type === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-950 dark:text-white'}`}>{transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : ''}{formatCurrency(transaction.amount)}</p><Badge variant={transaction.status === 'paid' ? 'success' : 'warning'}>{t(`transactions.status.${transaction.status}`)}</Badge></div></li>)}</ul>}
          <Link to="/transactions" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300">{t('dashboard.viewAllTransactions')}<ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
        </Card>

        <Card className="p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{t('dashboard.futureExpenses')}</h2><p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.futureExpensesDescription')}</p>
          {futureExpensesChart.data.length === 0 ? <div className="mt-5 flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{t('dashboard.noFutureExpenses')}</div> : <><p className="sr-only">{t('dashboard.futureExpensesSummary', { amount: formatCurrency(futureExpensesChart.data.reduce((sum, month) => sum + month.total, 0)), months: futureExpensesChart.data.length })}</p><div className="mt-5 h-72 overflow-hidden" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><BarChart data={futureExpensesChart.data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} /><XAxis dataKey="month" tickFormatter={(month) => formatMonthYear(`${month}-01`)} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={58} /><RechartsTooltip contentStyle={tooltipStyle} labelFormatter={(month) => formatMonthYear(`${month}-01`)} formatter={(value) => formatCurrency(Number(value))} /><Legend />{futureExpensesChart.categories.map((category) => <Bar key={category.key} dataKey={category.key} name={category.label} fill={category.color} stackId="future-expenses" />)}</BarChart></ResponsiveContainer></div></>}
        </Card>
      </div>
      <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)} />
    </div>
  );
};
