import { describe, expect, it } from 'vitest';
import type { Category, Transaction } from '@/types';
import { buildFutureExpensesChart } from './future-expenses';

const categories: Category[] = [
  { id: 1, name: 'Mercado', type: 'expense', color: '#22c55e' },
  { id: 2, name: 'Lazer', type: 'expense' },
];

const transactions: Transaction[] = [
  { id: 1, type: 'expense', amount: 100, description: 'Parcela cartão', date: '2026-09-10', status: 'pending', isCreditCard: true, categoryId: 1 },
  { id: 2, type: 'expense', amount: 50, description: 'Conta agendada', date: '2026-11-05', status: 'pending', categoryId: 2 },
  { id: 3, type: 'expense', amount: 30, description: 'Sem categoria', date: '2026-11-20', status: 'pending' },
  { id: 4, type: 'expense', amount: 999, description: 'Já pago', date: '2026-10-08', status: 'paid', categoryId: 1 },
  { id: 5, type: 'income', amount: 500, description: 'Receita futura', date: '2026-10-08', status: 'pending' },
  { id: 6, type: 'expense', amount: 200, description: 'Despesa passada', date: '2026-08-31', status: 'pending', categoryId: 1 },
];

describe('buildFutureExpensesChart', () => {
  it('agrega despesas pendentes futuras por categoria e mantém meses intermediários', () => {
    const chart = buildFutureExpensesChart(
      transactions,
      categories,
      new Date(2026, 8, 1),
      'Sem categoria',
    );

    expect(chart.categories).toEqual([
      { key: 'category-1', label: 'Mercado', color: '#22c55e' },
      { key: 'category-2', label: 'Lazer', color: '#f59e0b' },
      { key: 'uncategorized', label: 'Sem categoria', color: '#14b8a6' },
    ]);
    expect(chart.data).toEqual([
      { month: '2026-09', total: 100, 'category-1': 100, 'category-2': 0, uncategorized: 0 },
      { month: '2026-10', total: 0, 'category-1': 0, 'category-2': 0, uncategorized: 0 },
      { month: '2026-11', total: 80, 'category-1': 0, 'category-2': 50, uncategorized: 30 },
    ]);
  });

  it('retorna uma série vazia quando não há despesas pendentes futuras', () => {
    const chart = buildFutureExpensesChart(
      transactions.filter((transaction) => transaction.id !== 1 && transaction.id !== 2 && transaction.id !== 3),
      categories,
      new Date(2026, 8, 1),
      'Sem categoria',
    );

    expect(chart).toEqual({ categories: [], data: [] });
  });
});
