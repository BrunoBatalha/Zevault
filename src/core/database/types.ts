/**
 * Tipos para a camada de banco de dados
 */

import type { Transaction } from '@/types';
import type { ImportData } from './import-data';

export type StoreName = 'accounts' | 'categories' | 'costCenters' | 'transactions' | 'creditCards';

export interface StoreConfig {
  name: StoreName;
  keyPath: string;
  autoIncrement: boolean;
}

export interface DatabaseOperations {
  connect(): Promise<IDBDatabase>;
  getAll<T>(storeName: StoreName): Promise<T[]>;
  get<T>(storeName: StoreName, id: number): Promise<T | undefined>;
  add<T>(storeName: StoreName, item: Omit<T, 'id'>): Promise<number>;
  bulkAdd<T>(storeName: StoreName, items: Array<Omit<T, 'id'>>): Promise<void>;
  update<T>(storeName: StoreName, id: number, updates: Partial<T>): Promise<void>;
  delete(storeName: StoreName, id: number): Promise<void>;
  replaceCreditCardPurchase<T extends { id?: number; groupId?: string }>(groupId: string, items: Array<Omit<T, 'id'>>): Promise<void>;
  changeCreditCardTransactionStatus(transactionId: number, newStatus: 'paid' | 'pending', cardAccountId?: number): Promise<void>;
  deleteCreditCardTransactions(transactionIds: number[]): Promise<void>;
  updateCreditCardTransaction(transactionId: number, updates: Partial<Transaction>, cardAccountId: number): Promise<void>;
  replaceFutureRecurringTransactions(seriesId: string, fromOccurrenceDate: string, items: Array<Omit<Transaction, 'id'>>): Promise<void>;
  deleteFutureRecurringTransactions(seriesId: string, fromOccurrenceDate: string): Promise<void>;
  replaceAllData(data: ImportData): Promise<void>;
  deleteDB(): Promise<void>;
}

export type SubscriberCallback = () => void;
