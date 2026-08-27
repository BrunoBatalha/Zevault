/**
 * Tipos para a camada de banco de dados
 */

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
  deleteDB(): Promise<void>;
}

export type SubscriberCallback = () => void;
