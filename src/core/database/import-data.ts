import type { Account, Category, CostCenter, CreditCard, Transaction } from '@/types';
import { DB_VERSION } from '@/core/utils/constants';

export interface ImportData {
  accounts: Account[];
  categories: Category[];
  costCenters: CostCenter[];
  transactions: Transaction[];
  creditCards: CreditCard[];
}

export interface SyncBackupDocument {
  protocolVersion: 1;
  schemaVersion: number;
  createdAt: string;
  counts: Record<keyof ImportData, number>;
  data: ImportData;
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
    const accountId = typeof transaction.accountId === 'number' ? transaction.accountId : null;
    const toAccountId = typeof transaction.toAccountId === 'number' ? transaction.toAccountId : null;
    if (accountId !== null && !accountIds.has(accountId)) throw new Error('Invalid transaction account');
    if (toAccountId !== null && !accountIds.has(toAccountId)) throw new Error('Invalid transfer account');
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
  const categoryIds = new Set(categories.map((category) => category.id!));
  const costCenterIds = new Set(costCenters.map((costCenter) => costCenter.id!));
  const creditCardIds = new Set(creditCards.map((card) => card.id!));
  const installmentGroups = new Map<string, { total: number; current: Set<number> }>();
  transactions.forEach((transaction) => {
    if (typeof transaction.categoryId === 'number' && !categoryIds.has(transaction.categoryId)) throw new Error('Invalid transaction category');
    if (typeof transaction.costCenterId === 'number' && !costCenterIds.has(transaction.costCenterId)) throw new Error('Invalid transaction cost center');
    if (typeof transaction.creditCardId === 'number' && !creditCardIds.has(transaction.creditCardId)) throw new Error('Invalid transaction credit card');
    if (transaction.installmentCurrent !== undefined || transaction.installmentTotal !== undefined) {
      if (
        !transaction.groupId
        || !Number.isInteger(transaction.installmentCurrent)
        || !Number.isInteger(transaction.installmentTotal)
        || transaction.installmentCurrent! < 1
        || transaction.installmentTotal! < transaction.installmentCurrent!
      ) throw new Error('Invalid installment');
      const group = installmentGroups.get(transaction.groupId) ?? { total: transaction.installmentTotal!, current: new Set<number>() };
      if (group.total !== transaction.installmentTotal || group.current.has(transaction.installmentCurrent!)) throw new Error('Invalid installment group');
      group.current.add(transaction.installmentCurrent!);
      installmentGroups.set(transaction.groupId, group);
    }
  });

  return {
    accounts,
    categories,
    transactions,
    creditCards,
    costCenters,
  };
};

export const prepareSyncBackup = (input: unknown): SyncBackupDocument => {
  const backup = asRecord(input, 'sync backup');
  if (
    backup.protocolVersion !== 1
    || typeof backup.schemaVersion !== 'number'
    || backup.schemaVersion < 1
    || backup.schemaVersion > DB_VERSION
    || typeof backup.createdAt !== 'string'
  ) throw new Error('Invalid sync backup');

  const rawData = asRecord(backup.data, 'sync backup data');
  for (const storeName of ['accounts', 'categories', 'costCenters', 'transactions', 'creditCards']) {
    if (!isArray(rawData[storeName])) throw new Error(`Missing ${storeName}`);
  }
  const data = prepareImportedData(rawData);
  const counts = asRecord(backup.counts, 'sync backup counts');
  for (const storeName of Object.keys(data) as Array<keyof ImportData>) {
    if (counts[storeName] !== data[storeName].length) throw new Error(`Invalid ${storeName} count`);
  }

  return {
    protocolVersion: 1,
    schemaVersion: backup.schemaVersion,
    createdAt: backup.createdAt,
    counts: counts as unknown as Record<keyof ImportData, number>,
    data,
  };
};
