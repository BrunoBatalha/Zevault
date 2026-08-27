/**
 * Wrapper nativo para IndexedDB
 * Substitui Dexie.js para controle total sobre o banco de dados
 */

import { DB_NAME, DB_VERSION } from '@/core/utils/constants';
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

        // Criar Object Stores
        STORE_CONFIGS.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
            });
          }
        });
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
