/**
 * Hook para gerenciar o tema da aplicação (claro/escuro)
 */

import { DEFAULTS, STORAGE_KEYS } from '@/core/utils/constants';
import type { ThemeMode } from '@/types/common';
import { useEffect, useState } from 'react';

interface UseThemeReturn {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * Hook para gerenciar o tema da aplicação
 * Persiste a escolha no localStorage e aplica a classe no DOM
 * 
 * @returns {UseThemeReturn} - Estado atual do tema e funções para manipulá-lo
 * 
 * @example
 * const { theme, setTheme, toggleTheme } = useTheme();
 */
export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    return (savedTheme as ThemeMode) || DEFAULTS.THEME;
  });

  useEffect(() => {
    // Aplicar tema ao DOM
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Persistir no localStorage
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, setTheme, toggleTheme };
};
