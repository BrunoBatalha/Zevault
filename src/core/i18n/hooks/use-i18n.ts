/**
 * @file use-i18n.ts
 * @description Hook customizado para internacionalização com formatadores de data, moeda e número
 * 
 * Este hook encapsula o useTranslation do react-i18next e adiciona funções
 * utilitárias para formatar valores de acordo com o locale atual.
 * 
 * @example
 * ```tsx
 * const { t, formatCurrency, formatDate, changeLanguage } = useI18n();
 * 
 * // Texto traduzido
 * <h1>{t('dashboard.totalBalance')}</h1>
 * 
 * // Moeda formatada
 * <span>{formatCurrency(1234.56)}</span> // R$ 1.234,56 (pt-BR)
 * 
 * // Data formatada
 * <span>{formatDate('2025-12-25')}</span> // 25/12/2025 (pt-BR)
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DEFAULT_LOCALE,
    getLocaleConfig,
    LOCALES,
    type LocaleConfig,
    type SupportedLocale
} from '../types';

/**
 * Faz parse seguro de uma string de data YYYY-MM-DD
 * Evita problemas de timezone colocando a hora em meio-dia
 */
function parseDateString(dateString: string | Date): Date {
  if (!dateString) return new Date();
  
  // Se já for um objeto Date
  if (dateString instanceof Date) return dateString;
  
  // Parse YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    // Usa meio-dia para evitar edge cases de timezone
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  
  // Fallback para Date constructor
  return new Date(dateString);
}

/**
 * Retorno do hook useI18n
 */
export interface UseI18nReturn {
  /** Função de tradução do i18next */
  t: (key: string, options?: Record<string, unknown>) => string;
  /** Instância do i18next */
  i18n: ReturnType<typeof useTranslation>['i18n'];
  /** Locale atual (ex: 'pt-BR') */
  locale: SupportedLocale;
  /** Configuração completa do locale atual */
  config: LocaleConfig;
  /** Lista de locales disponíveis */
  availableLocales: SupportedLocale[];
  
  // Formatadores
  /** Formata um número como moeda */
  formatCurrency: (value: number) => string;
  /** Formata uma data no formato curto (ex: 25/12/2025) */
  formatDate: (date: string | Date) => string;
  /** Formata uma data no formato longo (ex: 25 de dezembro de 2025) */
  formatDateLong: (date: string | Date) => string;
  /** Formata mês/ano (ex: dezembro de 2025) */
  formatMonthYear: (date: string | Date) => string;
  /** Formata um número (sem símbolo de moeda) */
  formatNumber: (value: number, decimals?: number) => string;
  /** Formata tempo relativo (ex: hoje, ontem, há 3 dias) */
  formatRelativeTime: (date: string | Date) => string;
  
  // Ações
  /** Muda o idioma do sistema */
  changeLanguage: (lng: SupportedLocale) => void;
  /** Alias para changeLanguage */
  setLocale: (lng: SupportedLocale) => void;
}

/**
 * Hook principal de internacionalização
 * 
 * Combina o useTranslation do react-i18next com formatadores
 * dinâmicos que respeitam o locale atual.
 */
export function useI18n(): UseI18nReturn {
  const { t, i18n } = useTranslation();
  
  // Determina o locale atual com fallback
  const locale = useMemo((): SupportedLocale => {
    const lang = i18n.language;
    if (lang in LOCALES) {
      return lang as SupportedLocale;
    }
    // Tenta match parcial
    const partial = Object.keys(LOCALES).find(k => k.startsWith(lang?.split('-')[0] || ''));
    return (partial as SupportedLocale) || DEFAULT_LOCALE;
  }, [i18n.language]);
  
  // Configuração do locale atual
  const config = useMemo(() => getLocaleConfig(locale), [locale]);
  
  /**
   * Formata um número como moeda
   * @example formatCurrency(1234.56) → "R$ 1.234,56" (pt-BR)
   */
  const formatCurrency = useCallback((value: number): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return new Intl.NumberFormat(locale, config.numberFormat).format(0);
    }
    return new Intl.NumberFormat(locale, config.numberFormat).format(value);
  }, [locale, config.numberFormat]);
  
  /**
   * Formata uma data no formato curto
   * @example formatDate('2025-12-25') → "25/12/2025" (pt-BR)
   */
  const formatDate = useCallback((date: string | Date): string => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    return new Intl.DateTimeFormat(locale, config.dateFormat).format(dateObj);
  }, [locale, config.dateFormat]);
  
  /**
   * Formata uma data no formato longo
   * @example formatDateLong('2025-12-25') → "25 de dezembro de 2025" (pt-BR)
   */
  const formatDateLong = useCallback((date: string | Date): string => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    return new Intl.DateTimeFormat(locale, config.dateLongFormat).format(dateObj);
  }, [locale, config.dateLongFormat]);
  
  /**
   * Formata mês e ano
   * @example formatMonthYear('2025-12-25') → "dezembro de 2025" (pt-BR)
   */
  const formatMonthYear = useCallback((date: string | Date): string => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    return new Intl.DateTimeFormat(locale, config.monthYearFormat).format(dateObj);
  }, [locale, config.monthYearFormat]);
  
  /**
   * Formata um número (sem símbolo de moeda)
   * @example formatNumber(1234.56) → "1.234,56" (pt-BR)
   */
  const formatNumber = useCallback((value: number, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }, [locale]);
  
  /**
   * Formata tempo relativo (hoje, ontem, há X dias)
   * @example formatRelativeTime(new Date()) → "hoje" (pt-BR)
   */
  const formatRelativeTime = useCallback((date: string | Date): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? parseDateString(date) : date;
    const now = new Date();
    
    // Normaliza para comparar apenas a data (sem hora)
    const dateNorm = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const nowNorm = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffMs = dateNorm.getTime() - nowNorm.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    // Casos especiais
    if (diffDays === 0) return t('dates.today');
    if (diffDays === -1) return t('dates.yesterday');
    if (diffDays === 1) return t('dates.tomorrow');
    
    // Usa Intl.RelativeTimeFormat para outros casos
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(diffDays, 'day');
    } catch {
      // Fallback se RelativeTimeFormat não estiver disponível
      return formatDate(date);
    }
  }, [locale, t, formatDate]);
  
  /**
   * Muda o idioma do sistema
   */
  const changeLanguage = useCallback((lng: SupportedLocale) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    // Atualiza o atributo lang do HTML para acessibilidade
    document.documentElement.lang = lng;
  }, [i18n]);

  /**
   * Alias para changeLanguage (compatibilidade)
   */
  const setLocale = changeLanguage;
  
  return {
    t: t as (key: string, options?: Record<string, unknown>) => string,
    i18n,
    locale,
    config,
    availableLocales: Object.keys(LOCALES) as SupportedLocale[],
    formatCurrency,
    formatDate,
    formatDateLong,
    formatMonthYear,
    formatNumber,
    formatRelativeTime,
    changeLanguage,
    setLocale,
  };
}

export default useI18n;
