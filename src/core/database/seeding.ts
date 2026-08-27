/**
 * Dados iniciais (seed) para o banco de dados
 */

import type { Account, Category, CostCenter } from '@/types/entities';

export const SEED_ACCOUNTS: Omit<Account, 'id'>[] = [
  { name: 'Banco Principal', type: 'bank', balance: 15000 },
  { name: 'Caixa Pequeno', type: 'cash', balance: 500 },
  { name: 'Cartão Corporativo', type: 'card', balance: -1200 },
];

export const SEED_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Vendas de Software', type: 'income' },
  { name: 'Consultoria', type: 'income' },
  { name: 'Servidores AWS', type: 'expense' },
  { name: 'Marketing', type: 'expense' },
  { name: 'Salários', type: 'expense' },
];

export const SEED_COST_CENTERS: Omit<CostCenter, 'id'>[] = [
  { name: 'Operações', budget: 50000 },
  { name: 'Marketing', budget: 15000 },
  { name: 'P&D', budget: 30000 },
];
