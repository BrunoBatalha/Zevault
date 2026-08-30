/**
 * Constantes da aplicação
 */

/**
 * Configurações do IndexedDB
 */
export const DB_NAME = 'FinancierProDB_Native';
export const DB_VERSION = 3;

/**
 * Nomes dos stores do IndexedDB
 */
export const STORE_NAMES = {
  ACCOUNTS: 'accounts',
  CATEGORIES: 'categories',
  COST_CENTERS: 'costCenters',
  TRANSACTIONS: 'transactions',
  CREDIT_CARDS: 'creditCards',
} as const;

/**
 * Configurações de LocalStorage
 */
export const STORAGE_KEYS = {
  USER: 'financier_user',
  THEME: 'financier_theme',
  ONBOARDING_COMPLETED: 'financier_onboarding_completed',
} as const;

/**
 * Limites e validações
 */
export const LIMITS = {
  MAX_TRANSACTION_AMOUNT: 999999999,
  MIN_TRANSACTION_AMOUNT: 0.01,
  MAX_INSTALLMENTS: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NAME_LENGTH: 100,
} as const;

/**
 * Valores padrão
 */
export const DEFAULTS = {
  CURRENCY: 'BRL',
  LOCALE: 'pt-BR',
  THEME: 'light' as const,
  ITEMS_PER_PAGE: 50,
} as const;

/**
 * Atalhos de teclado
 */
export const KEYBOARD_SHORTCUTS = {
  COMMAND_PALETTE: 'k',
  NEW_TRANSACTION: 'n',
  SEARCH: 's',
  TOGGLE_THEME: 't',
} as const;

/**
 * Labels de tipos
 */
export const TYPE_LABELS = {
  TRANSACTION_TYPES: {
    expense: 'Despesa',
    income: 'Receita',
    transfer: 'Transferência',
  },
  CATEGORY_TYPES: {
    income: 'Receita',
    expense: 'Despesa',
  },
} as const;

/**
 * Cores para categorias e badges
 */
export const COLORS = {
  BADGE: {
    expense: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    income: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    transfer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  CHART: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
} as const;
