/**
 * Tipos de props para componentes UI
 */

import type { LucideIcon } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';
import type { ButtonVariant, ComponentSize } from './common';

/**
 * Props base para componentes
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Props do componente Card
 */
export interface CardProps extends BaseComponentProps {
  padding?: ComponentSize;
  shadow?: boolean;
}

/**
 * Props do componente Button
 */
export interface ButtonProps extends BaseComponentProps {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: ButtonVariant;
  size?: ComponentSize;
  icon?: LucideIcon;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
}

/**
 * Props do componente Badge
 */
export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: ComponentSize;
}

/**
 * Props do componente Modal
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
}

/**
 * Props do componente Input
 */
export interface InputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password' | 'date';
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Props do componente Select
 */
export interface SelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Props do componente Sidebar
 */
export interface SidebarProps {
  userName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

/**
 * Props do Command Palette
 */
export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props do Onboarding Modal
 */
export interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (name: string) => void;
}

/**
 * Props do Confirmation Modal
 */
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

/**
 * Props do Delete Installment Modal
 */
export interface DeleteInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'single' | 'remaining' | 'all') => void;
}

/**
 * Props do Landing Page
 */
export interface LandingPageProps {
  onGetStarted: () => void;
}

/**
 * Props do Dashboard
 */
export interface DashboardProps {
  formatCurrency: (value: number) => string;
}

/**
 * Props genérico para listas com formatação de moeda
 */
export interface ListWithCurrencyProps {
  formatCurrency: (value: number) => string;
}
