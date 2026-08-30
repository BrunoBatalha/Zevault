import { db } from '@/core/database'
import type { Account, Transaction, Category, CreditCard } from '@/types'

export async function seedAccount(overrides?: Partial<Account>) {
  return db.add<Account>('accounts', {
    name: 'Conta Teste',
    balance: 1000,
    ...overrides,
  } as Omit<Account, 'id'>)
}

export async function seedTransaction(overrides?: Partial<Transaction>) {
  return db.add<Transaction>('transactions', {
    type: 'expense',
    amount: 100,
    description: 'Teste',
    date: '2026-01-15',
    status: 'paid',
    accountId: null,
    ...overrides,
  } as Omit<Transaction, 'id'>)
}

export async function seedCategory(overrides?: Partial<Category>) {
  return db.add<Category>('categories', {
    name: 'Categoria Teste',
    type: 'expense',
    ...overrides,
  } as Omit<Category, 'id'>)
}

export async function seedCreditCard(overrides?: Partial<CreditCard>) {
  return db.add<CreditCard>('creditCards', {
    name: 'Cartão Teste',
    limit: 5000,
    closingDay: 10,
    dueDay: 20,
    accountId: 1,
    ...overrides,
  } as Omit<CreditCard, 'id'>)
}
