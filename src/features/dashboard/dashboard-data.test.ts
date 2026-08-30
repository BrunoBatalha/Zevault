import { describe, expect, it } from 'vitest';
import type { Account, Transaction } from '@/types';
import { buildCashFlowLast30Days, buildDashboardSummary, getPendingCommitments } from './dashboard-data';

const accounts: Account[] = [
  { id: 1, name: 'Conta', balance: 2000 },
  { id: 2, name: 'Dinheiro', balance: 500 },
];

const transactions: Transaction[] = [
  { id: 1, type: 'expense', amount: 100, description: 'Atrasada', date: '2026-08-25', status: 'pending' },
  { id: 2, type: 'expense', amount: 300, description: 'Próxima', date: '2026-08-30', status: 'pending' },
  { id: 3, type: 'expense', amount: 600, description: 'Distante', date: '2026-10-01', status: 'pending' },
  { id: 4, type: 'expense', amount: 50, description: 'Paga', date: '2026-08-27', status: 'paid' },
  { id: 5, type: 'income', amount: 900, description: 'Receita pendente', date: '2026-08-29', status: 'pending' },
];

describe('dashboard financial data', () => {
  it('separa saldo atual, compromissos e valor livre usando apenas despesas pendentes', () => {
    expect(buildDashboardSummary(accounts, transactions, new Date(2026, 7, 27))).toEqual({
      totalBalance: 2500,
      committed: 1000,
      availableAfterCommitments: 1500,
      overdueCount: 1,
      dueSoonCount: 1,
      nextCommitment: transactions[1],
    });
  });

  it('filtra compromissos por horizonte sem esconder despesas vencidas', () => {
    expect(getPendingCommitments(transactions, new Date(2026, 7, 27), 7).map(({ id }) => id)).toEqual([1, 2]);
    expect(getPendingCommitments(transactions, new Date(2026, 7, 27), 30).map(({ id }) => id)).toEqual([1, 2]);
    expect(getPendingCommitments(transactions, new Date(2026, 7, 27), 'all').map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it('produz 30 dias corridos e ignora pendentes e transferências no fluxo realizado', () => {
    const flow = buildCashFlowLast30Days([
      ...transactions,
      { id: 6, type: 'income', amount: 500, description: 'Salário', date: '2026-08-26', status: 'paid' },
      { id: 7, type: 'transfer', amount: 200, description: 'Transferência', date: '2026-08-26', status: 'paid' },
    ], new Date(2026, 7, 27));

    expect(flow).toHaveLength(30);
    expect(flow[0].date).toBe('2026-07-29');
    expect(flow.at(-1)?.date).toBe('2026-08-27');
    expect(flow.find(({ date }) => date === '2026-08-26')).toMatchObject({ income: 500, expense: 0, net: 500 });
    expect(flow.find(({ date }) => date === '2026-08-27')).toMatchObject({ income: 0, expense: 50, net: -50 });
  });
});
