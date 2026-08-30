/**
 * Entidades do domínio do FinancierPro
 * Tipos TypeScript para as principais entidades do banco de dados
 */

/**
 * Tipos de transação
 */
export type TransactionType = 'expense' | 'income' | 'transfer';

/**
 * Tipos de categoria
 */
export type CategoryType = 'income' | 'expense';

/**
 * Conta bancária ou financeira
 */
export interface Account {
  id?: number;
  name: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Status de pagamento
 */
export type TransactionStatus = 'paid' | 'pending';

/**
 * Transação financeira (despesa, receita ou transferência)
 */
export interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  accountId?: number | null;
  toAccountId?: number | null; // Para transferências
  categoryId?: number | null;
  costCenterId?: number | null;
  status: TransactionStatus;
  isCreditCard?: boolean;
  creditCardId?: number | null;
  purchaseDate?: string; // Data original da compra (para parcelado)
  installmentCurrent?: number;
  installmentTotal?: number;
  groupId?: string; // Para agrupar parcelas
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Categoria de transação
 */
export interface Category {
  id?: number;
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Centro de custo para organização de despesas
 */
export interface CostCenter {
  id?: number;
  name: string;
  budget: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Cartão de crédito
 */
export interface CreditCard {
  id?: number;
  name: string;
  limit: number;
  closingDay: number; // Dia do fechamento (1-31)
  dueDay: number; // Dia do vencimento (1-31)
  accountId: number | null; // Conta vinculada para pagamento; null apenas para dados legados
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Dados do usuário (onboarding)
 */
export interface User {
  name: string;
  email?: string;
  company?: string;
  hasCompletedOnboarding: boolean;
  theme?: 'light' | 'dark';
  createdAt?: string;
}
