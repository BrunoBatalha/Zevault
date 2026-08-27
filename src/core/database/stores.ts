/**
 * Configuração dos stores do IndexedDB
 */

import type { StoreConfig } from './types';

export const STORE_CONFIGS: StoreConfig[] = [
  { name: 'accounts', keyPath: 'id', autoIncrement: true },
  { name: 'categories', keyPath: 'id', autoIncrement: true },
  { name: 'costCenters', keyPath: 'id', autoIncrement: true },
  { name: 'transactions', keyPath: 'id', autoIncrement: true },
  { name: 'creditCards', keyPath: 'id', autoIncrement: true },
];
