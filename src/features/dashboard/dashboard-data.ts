import type { Account, Transaction } from '@/types';

export type CommitmentPeriod = 7 | 30 | 'all';

export interface DashboardSummary {
  totalBalance: number;
  committed: number;
  availableAfterCommitments: number;
  overdueCount: number;
  dueSoonCount: number;
  nextCommitment: Transaction | null;
}

export interface CashFlowDay {
  date: string;
  income: number;
  expense: number;
  net: number;
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isPendingExpense(transaction: Transaction): boolean {
  return transaction.type === 'expense' && transaction.status === 'pending';
}

export function getPendingCommitments(
  transactions: Transaction[],
  today: Date = new Date(),
  period: CommitmentPeriod = 'all',
): Transaction[] {
  const todayAtStart = startOfDay(today);
  const lastDay = period === 'all'
    ? null
    : new Date(todayAtStart.getFullYear(), todayAtStart.getMonth(), todayAtStart.getDate() + period);

  return transactions
    .filter(isPendingExpense)
    .filter((transaction) => {
      if (!lastDay) return true;
      return parseLocalDate(transaction.date) <= lastDay;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildDashboardSummary(
  accounts: Account[],
  transactions: Transaction[],
  today: Date = new Date(),
): DashboardSummary {
  const todayAtStart = startOfDay(today);
  const soonLimit = new Date(todayAtStart.getFullYear(), todayAtStart.getMonth(), todayAtStart.getDate() + 7);
  const pendingExpenses = getPendingCommitments(transactions, today, 'all');
  const upcoming = pendingExpenses.filter((transaction) => parseLocalDate(transaction.date) >= todayAtStart);
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const committed = pendingExpenses.reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return {
    totalBalance,
    committed,
    availableAfterCommitments: totalBalance - committed,
    overdueCount: pendingExpenses.filter((transaction) => parseLocalDate(transaction.date) < todayAtStart).length,
    dueSoonCount: upcoming.filter((transaction) => parseLocalDate(transaction.date) <= soonLimit).length,
    nextCommitment: upcoming[0] ?? null,
  };
}

export function buildCashFlowLast30Days(
  transactions: Transaction[],
  today: Date = new Date(),
): CashFlowDay[] {
  const end = startOfDay(today);
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29);
  const data = new Map<string, CashFlowDay>();

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = toDateKey(cursor);
    data.set(date, { date, income: 0, expense: 0, net: 0 });
  }

  transactions.forEach((transaction) => {
    if (transaction.status !== 'paid' || transaction.type === 'transfer') return;
    const day = data.get(transaction.date);
    if (!day) return;
    const amount = Number(transaction.amount);
    if (transaction.type === 'income') day.income += amount;
    if (transaction.type === 'expense') day.expense += amount;
    day.net = day.income - day.expense;
  });

  return Array.from(data.values());
}
