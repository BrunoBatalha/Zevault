/**
 * Componente Card
 * Container estilizado com sombras e bordas
 */

import type { CardProps } from '@/types';

export const Card = ({ children, className = '' }: CardProps) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-black/20 ${className}`}
  >
    {children}
  </div>
);
