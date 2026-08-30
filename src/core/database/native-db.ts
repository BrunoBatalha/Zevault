/**
 * Wrapper nativo para IndexedDB
 * Substitui Dexie.js para controle total sobre o banco de dados
 */

import { DB_NAME, DB_VERSION } from '@/core/utils/constants';
import type { Account, Transaction } from '@/types';
import { STORE_CONFIGS } from './stores';
import type { StoreName, SubscriberCallback } from './types';

/**
 * Classe principal para gerenciamento do IndexedDB
 */
class NativeDB {
  private db: IDBDatabase | null = null;
  private subscribers: Set<SubscriberCallback> = new Set();

  /**
   * Conecta ao banco de dados IndexedDB
   */
  async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Database error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const upgradeTransaction = (event.target as IDBOpenDBRequest).transaction!;

        // Criar Object Stores
        STORE_CONFIGS.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
            });
          }
        });

        if (event.oldVersion < 3) {
          const accountsStore = upgradeTransaction.objectStore('accounts');
          const creditCardsStore = upgradeTransaction.objectStore('creditCards');
          const accountIds: number[] = [];
          const accountCursor = accountsStore.openCursor();

          accountCursor.onsuccess = () => {
            const cursor = accountCursor.result;
            if (cursor) {
              const account = { ...cursor.value };
              delete account.type;
              cursor.update(account);
              accountIds.push(Number(cursor.primaryKey));
              cursor.continue();
              return;
            }

            const cardCursor = creditCardsStore.openCursor();
            cardCursor.onsuccess = () => {
              const card = cardCursor.result;
              if (!card) return;
              if (card.value.accountId === null || card.value.accountId === undefined) {
                card.update({
                  ...card.value,
                  accountId: accountIds.length === 1 ? accountIds[0] : null,
                });
              }
              card.continue();
            };
          };
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
    });
  }

  /**
   * Notifica todos os subscribers sobre mudanças no banco
   */
  private notify(): void {
    this.subscribers.forEach((cb) => cb());
  }

  /**
   * Registra um callback para ser notificado sobre mudanças
   */
  subscribe(callback: SubscriberCallback): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // --- CRUD Operations ---

  /**
   * Busca todos os registros de um store
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Busca um registro específico por ID
   */
  async get<T>(storeName: StoreName, id: number): Promise<T | undefined> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(Number(id));
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Adiciona um novo registro
   */
  async add<T>(storeName: StoreName, item: Omit<T, 'id'>): Promise<number> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(item);
      tx.oncomplete = () => {
        this.notify();
        resolve(request.result as number);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Adiciona múltiplos registros de uma vez
   */
  async bulkAdd<T>(storeName: StoreName, items: Array<Omit<T, 'id'>>): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach((item) => store.add(item));
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Substitui todas as transações de uma compra parcelada na mesma transação IDB.
   */
  async replaceCreditCardPurchase<T extends { id?: number; groupId?: string }>(
    groupId: string,
    items: Array<Omit<T, 'id'>>,
  ): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions', 'accounts'], 'readwrite');
      const store = tx.objectStore('transactions');
      const accountsStore = tx.objectStore('accounts');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const previousItems = getAllRequest.result as T[];
        const balanceAdjustments = new Map<number, number>();
        previousItems
          .filter((item) => item.groupId === groupId && item.id !== undefined)
          .forEach((item) => {
            const financialItem = item as T & Partial<Transaction>;
            if (financialItem.status === 'paid' && financialItem.accountId) {
              balanceAdjustments.set(
                financialItem.accountId,
                (balanceAdjustments.get(financialItem.accountId) ?? 0) + (financialItem.amount ?? 0),
              );
            }
            store.delete(item.id!);
          });
        balanceAdjustments.forEach((amount, accountId) => {
          const accountRequest = accountsStore.get(accountId);
          accountRequest.onsuccess = () => {
            const account = accountRequest.result as Account | undefined;
            if (account) accountsStore.put({ ...account, balance: account.balance + amount });
          };
        });
        items.forEach((item) => store.add(item));
      };
      getAllRequest.onerror = () => reject(getAllRequest.error);
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));
    });
  }

  async changeCreditCardTransactionStatus(
    transactionId: number,
    newStatus: 'paid' | 'pending',
    cardAccountId?: number,
  ): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions', 'accounts'], 'readwrite');
      const transactionsStore = tx.objectStore('transactions');
      const accountsStore = tx.objectStore('accounts');
      const transactionRequest = transactionsStore.get(transactionId);

      transactionRequest.onsuccess = () => {
        const transaction = transactionRequest.result as Transaction | undefined;
        if (!transaction || !transaction.isCreditCard) {
          tx.abort();
          return;
        }
        if (transaction.status === newStatus) return;

        const accountId = newStatus === 'paid' ? cardAccountId : transaction.accountId ?? undefined;
        if (!accountId) {
          if (newStatus === 'pending') {
            transactionsStore.put({ ...transaction, status: newStatus, accountId: null });
            return;
          }
          tx.abort();
          return;
        }

        const accountRequest = accountsStore.get(accountId);
        accountRequest.onsuccess = () => {
          const account = accountRequest.result as Account | undefined;
          if (!account) {
            tx.abort();
            return;
          }
          const balance = newStatus === 'paid'
            ? account.balance - transaction.amount
            : account.balance + transaction.amount;
          accountsStore.put({ ...account, balance });
          transactionsStore.put({
            ...transaction,
            status: newStatus,
            accountId: newStatus === 'paid' ? accountId : null,
          });
        };
      };
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Credit card transaction could not be updated'));
    });
  }

  async deleteCreditCardTransactions(transactionIds: number[]): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions', 'accounts'], 'readwrite');
      const transactionsStore = tx.objectStore('transactions');
      const accountsStore = tx.objectStore('accounts');
      const balanceAdjustments = new Map<number, number>();
      const transactionsRequest = transactionsStore.getAll();

      transactionsRequest.onsuccess = () => {
        const ids = new Set(transactionIds);
        const transactions = (transactionsRequest.result as Transaction[]).filter(
          (transaction) => transaction.id !== undefined && ids.has(transaction.id),
        );
        transactions.forEach((transaction) => {
          if (transaction.status === 'paid' && transaction.accountId) {
            balanceAdjustments.set(
              transaction.accountId,
              (balanceAdjustments.get(transaction.accountId) ?? 0) + transaction.amount,
            );
          }
          transactionsStore.delete(transaction.id!);
        });
        balanceAdjustments.forEach((amount, accountId) => {
          const accountRequest = accountsStore.get(accountId);
          accountRequest.onsuccess = () => {
            const account = accountRequest.result as Account | undefined;
            if (account) accountsStore.put({ ...account, balance: account.balance + amount });
          };
        });
      };
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Credit card transactions could not be deleted'));
    });
  }

  async updateCreditCardTransaction(
    transactionId: number,
    updates: Partial<Transaction>,
    cardAccountId: number,
  ): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['transactions', 'accounts'], 'readwrite');
      const transactionsStore = tx.objectStore('transactions');
      const accountsStore = tx.objectStore('accounts');
      const transactionRequest = transactionsStore.get(transactionId);

      transactionRequest.onsuccess = () => {
        const transaction = transactionRequest.result as Transaction | undefined;
        if (!transaction || !transaction.isCreditCard) {
          tx.abort();
          return;
        }

        const updatedTransaction = { ...transaction, ...updates };
        if (transaction.status !== 'paid' || !transaction.accountId) {
          transactionsStore.put({ ...updatedTransaction, accountId: transaction.accountId ?? null });
          return;
        }

        const previousAccountRequest = accountsStore.get(transaction.accountId);
        previousAccountRequest.onsuccess = () => {
          const previousAccount = previousAccountRequest.result as Account | undefined;
          if (!previousAccount) {
            tx.abort();
            return;
          }

          if (transaction.accountId === cardAccountId) {
            accountsStore.put({
              ...previousAccount,
              balance: previousAccount.balance + transaction.amount - updatedTransaction.amount,
            });
            transactionsStore.put({ ...updatedTransaction, accountId: cardAccountId });
            return;
          }

          const newAccountRequest = accountsStore.get(cardAccountId);
          newAccountRequest.onsuccess = () => {
            const newAccount = newAccountRequest.result as Account | undefined;
            if (!newAccount) {
              tx.abort();
              return;
            }
            accountsStore.put({ ...previousAccount, balance: previousAccount.balance + transaction.amount });
            accountsStore.put({ ...newAccount, balance: newAccount.balance - updatedTransaction.amount });
            transactionsStore.put({ ...updatedTransaction, accountId: cardAccountId });
          };
        };
      };
      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Credit card transaction could not be edited'));
    });
  }

  /**
   * Atualiza um registro existente
   */
  async update<T>(storeName: StoreName, id: number, updates: Partial<T>): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      // Buscar o item primeiro
      const getReq = store.get(Number(id));

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (!item) {
          reject(new Error('Item not found'));
          return;
        }
        const updatedItem = { ...item, ...updates };
        store.put(updatedItem);
      };

      tx.oncomplete = () => {
        this.notify();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Deleta um registro por ID
   */
  async delete(storeName: StoreName, id: number): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      const key = Number(id);
      console.log(`[DB] Deletando de ${storeName} ID: ${key}`);
      const request = store.delete(key);

      request.onsuccess = () => {
        // Solicitação aceita pelo IDB
      };

      tx.oncomplete = () => {
        this.notify();
        resolve();
      };

      tx.onerror = (e) => {
        console.error('[DB] Erro ao deletar:', (e.target as IDBRequest).error);
        reject((e.target as IDBRequest).error);
      };
    });
  }

  /**
   * Limpa todos os registros de uma store
   */
  async clear(storeName: StoreName): Promise<void> {
    await this.connect();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`[DB] Store ${storeName} cleared`);
      };

      tx.oncomplete = () => {
        this.notify();
        resolve();
      };

      tx.onerror = (e) => {
        console.error(`[DB] Error clearing ${storeName}:`, (e.target as IDBRequest).error);
        reject((e.target as IDBRequest).error);
      };
    });
  }

  /**
   * Executa o seeding inicial do banco
   */
  async seed(): Promise<void> {
    // await this.checkSeeding();
  }

  /**
   * Deleta o banco de dados inteiro (usado em reset)
   */
  async deleteDB(): Promise<void> {
    // Fechar conexão existente se houver
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      console.log('[DB] Attempting to delete database...');
      const req = indexedDB.deleteDatabase(DB_NAME);

      req.onsuccess = () => {
        console.log('[DB] Database deleted successfully');
        resolve();
      };

      req.onerror = (event) => {
        console.error('[DB] Error deleting database:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };

      req.onblocked = () => {
        console.warn('[DB] Delete blocked. Closing connection and retrying...');
        // Em cenários de aba única, isso raramente bloqueia se fecharmos a conexão antes
        resolve();
      };
    });
  }
}

// Instância singleton do banco de dados
export const db = new NativeDB();
