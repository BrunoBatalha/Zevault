import type { Account, Category, CostCenter, CreditCard, Transaction } from '@/types';

export interface ImportData {
  accounts: Account[];
  categories: Category[];
  costCenters: CostCenter[];
  transactions: Transaction[];
  creditCards: CreditCard[];
}

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);
const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${label}`);
  return value as Record<string, unknown>;
};
const hasValidId = (record: Record<string, unknown>) => typeof record.id === 'number';

export const prepareImportedData = (input: unknown): ImportData => {
  if (!input || typeof input !== 'object') throw new Error('Invalid backup');
  const data = input as Record<string, unknown>;
  if (!isArray(data.accounts) || !isArray(data.categories) || !isArray(data.transactions)) {
    throw new Error('Invalid backup');
  }

  const accounts = data.accounts.map((rawAccount) => {
    const account = { ...asRecord(rawAccount, 'account') };
    delete account.type;
    if (!hasValidId(account) || typeof account.name !== 'string' || typeof account.balance !== 'number') {
      throw new Error('Invalid account');
    }
    return account as unknown as Account;
  });
  const accountIds = new Set(accounts.map((account) => account.id!));
  const fallbackAccountId = accounts.length === 1 ? accounts[0].id! : null;
  const rawCards = isArray(data.creditCards) ? data.creditCards : [];
  const creditCards = rawCards.map((rawCard) => {
    const card = { ...asRecord(rawCard, 'credit card') };
    const accountId = typeof card.accountId === 'number' ? card.accountId : fallbackAccountId;
    if (
      !hasValidId(card)
      || typeof card.name !== 'string'
      || typeof card.limit !== 'number'
      || typeof card.closingDay !== 'number'
      || typeof card.dueDay !== 'number'
    ) throw new Error('Invalid credit card');
    if (!accountId || !accountIds.has(accountId)) throw new Error('Invalid credit card account');
    return { ...card, accountId } as unknown as CreditCard;
  });
  const categories = data.categories.map((rawCategory) => {
    const category = asRecord(rawCategory, 'category');
    if (
      !hasValidId(category)
      || typeof category.name !== 'string'
      || (category.type !== 'income' && category.type !== 'expense')
    ) throw new Error('Invalid category');
    return category as unknown as Category;
  });
  const transactions = data.transactions.map((rawTransaction) => {
    const transaction = asRecord(rawTransaction, 'transaction');
    if (
      !hasValidId(transaction)
      || !['expense', 'income', 'transfer'].includes(String(transaction.type))
      || typeof transaction.amount !== 'number'
      || typeof transaction.description !== 'string'
      || typeof transaction.date !== 'string'
      || !['paid', 'pending'].includes(String(transaction.status))
    ) throw new Error('Invalid transaction');
    return transaction as unknown as Transaction;
  });
  const rawCostCenters = isArray(data.costCenters) ? data.costCenters : [];
  const costCenters = rawCostCenters.map((rawCostCenter) => {
    const costCenter = asRecord(rawCostCenter, 'cost center');
    if (
      !hasValidId(costCenter)
      || typeof costCenter.name !== 'string'
      || typeof costCenter.budget !== 'number'
    ) throw new Error('Invalid cost center');
    return costCenter as unknown as CostCenter;
  });

  return {
    accounts,
    categories,
    transactions,
    creditCards,
    costCenters,
  };
};
