/**
 * Tipos comuns e utilitários
 */

/**
 * Tema da aplicação
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Variantes de botões
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Tamanhos de componentes
 */
export type ComponentSize = 'sm' | 'md' | 'lg';

/**
 * Status de operações assíncronas
 */
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Opção genérica para selects
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * Resposta de operações CRUD
 */
export interface CrudResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Filtros de transação
 */
export interface TransactionFilters {
  type?: 'all' | 'expense' | 'income' | 'transfer';
  accountId?: number;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

/**
 * Dados agregados para dashboard
 */
export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  transactionCount: number;
}
