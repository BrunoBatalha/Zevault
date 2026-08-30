/**
 * Componente Button
 * Botão com múltiplas variantes de estilo
 */

import type { ButtonProps } from '@/types';
import { forwardRef } from 'react';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    onClick,
    variant = 'primary',
    icon: Icon,
    className = '',
    type = 'button',
    disabled = false,
  }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
    primary:
      'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-200 focus:ring-emerald-500 border border-transparent',
    secondary:
      'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 focus:ring-slate-200 shadow-sm',
    danger:
      'bg-rose-600 text-white hover:bg-rose-500 hover:shadow-md hover:shadow-rose-200 focus:ring-rose-500 border border-transparent',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-200 focus:ring-emerald-500 border border-transparent',
    };

    return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
    );
  },
);

Button.displayName = 'Button';
