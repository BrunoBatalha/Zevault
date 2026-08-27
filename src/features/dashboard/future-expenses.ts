import type { Category, Transaction } from '@/types';

const FALLBACK_CATEGORY_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#14b8a6',
  '#ec4899',
  '#8b5cf6',
  '#0ea5e9',
];

export interface FutureExpenseCategory {
  key: string;
  label: string;
  color: string;
}

export interface FutureExpenseMonth {
  month: string;
  total: number;
  [categoryKey: string]: string | number;
}

export interface FutureExpenseChart {
  categories: FutureExpenseCategory[];
  data: FutureExpenseMonth[];
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Agrupa despesas pendentes a partir de hoje por mês e categoria para o dashboard.
 */
export function buildFutureExpensesChart(
  transactions: Transaction[],
  categories: Category[],
  today: Date = new Date(),
  uncategorizedLabel: string,
): FutureExpenseChart {
  const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categoryDefinitions = new Map<string, FutureExpenseCategory>();
  const expenseByMonth = new Map<string, Map<string, number>>();
  let lastExpenseDate: Date | null = null;

  transactions.forEach((transaction) => {
    const transactionDate = parseLocalDate(transaction.date);
    const isFuturePendingExpense =
      transaction.type === 'expense' &&
      transaction.status === 'pending' &&
      transactionDate >= todayAtStart;

    if (!isFuturePendingExpense) return;

    const category = categoryById.get(transaction.categoryId ?? undefined);
    const categoryKey = category?.id !== undefined ? `category-${category.id}` : 'uncategorized';

    if (!categoryDefinitions.has(categoryKey)) {
      const categoryIndex = categoryDefinitions.size;
      categoryDefinitions.set(categoryKey, {
        key: categoryKey,
        label: category?.name ?? uncategorizedLabel,
        color: category?.color ?? FALLBACK_CATEGORY_COLORS[categoryIndex % FALLBACK_CATEGORY_COLORS.length],
      });
    }

    const monthKey = getMonthKey(transactionDate);
    const monthlyCategories = expenseByMonth.get(monthKey) ?? new Map<string, number>();
    monthlyCategories.set(categoryKey, (monthlyCategories.get(categoryKey) ?? 0) + Number(transaction.amount));
    expenseByMonth.set(monthKey, monthlyCategories);

    if (!lastExpenseDate || transactionDate > lastExpenseDate) {
      lastExpenseDate = transactionDate;
    }
  });

  if (!lastExpenseDate) {
    return { categories: [], data: [] };
  }

  const finalExpenseDate = lastExpenseDate as Date;
  const data: FutureExpenseMonth[] = [];
  const monthCursor = new Date(todayAtStart.getFullYear(), todayAtStart.getMonth(), 1);
  const lastMonth = new Date(finalExpenseDate.getFullYear(), finalExpenseDate.getMonth(), 1);

  while (monthCursor <= lastMonth) {
    const monthKey = getMonthKey(monthCursor);
    const monthlyCategories = expenseByMonth.get(monthKey);
    const monthData: FutureExpenseMonth = { month: monthKey, total: 0 };

    categoryDefinitions.forEach((category) => {
      const amount = monthlyCategories?.get(category.key) ?? 0;
      monthData[category.key] = amount;
      monthData.total += amount;
    });

    data.push(monthData);
    monthCursor.setMonth(monthCursor.getMonth() + 1);
  }

  return {
    categories: Array.from(categoryDefinitions.values()),
    data,
  };
}
