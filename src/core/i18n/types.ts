/**
 * @file types.ts
 * @description Tipos TypeScript para o sistema de internacionalização (i18n)
 * 
 * Define as configurações de locale, formatos de data, moeda e número
 * para cada idioma suportado pelo sistema.
 */

/**
 * Idiomas suportados pelo sistema
 * - pt-BR: Português (Brasil) - Idioma padrão
 * - en-US: Inglês (Estados Unidos)
 * - es-ES: Espanhol (Espanha)
 */
export type SupportedLocale = 'pt-BR' | 'en-US' | 'es-ES';

/**
 * Configuração completa de um locale
 */
export interface LocaleConfig {
  /** Código do locale (ex: 'pt-BR') */
  code: SupportedLocale;
  /** Nome em inglês */
  name: string;
  /** Nome no idioma nativo */
  nativeName: string;
  /** Código da moeda (ISO 4217) */
  currency: string;
  /** Símbolo da moeda */
  currencySymbol: string;
  /** Formato de data para Intl.DateTimeFormat */
  dateFormat: Intl.DateTimeFormatOptions;
  /** Formato de data longa (com mês por extenso) */
  dateLongFormat: Intl.DateTimeFormatOptions;
  /** Formato de mês/ano */
  monthYearFormat: Intl.DateTimeFormatOptions;
  /** Formato de número/moeda para Intl.NumberFormat */
  numberFormat: Intl.NumberFormatOptions;
  /** Separador decimal */
  decimalSeparator: string;
  /** Separador de milhar */
  thousandsSeparator: string;
  /** Emoji da bandeira (para UI) */
  flag: string;
}

/**
 * Configurações de todos os locales suportados
 */
export const LOCALES: Record<SupportedLocale, LocaleConfig> = {
  'pt-BR': {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    currency: 'BRL',
    currencySymbol: 'R$',
    dateFormat: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    },
    dateLongFormat: {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    },
    monthYearFormat: {
      month: 'long',
      year: 'numeric'
    },
    numberFormat: { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    decimalSeparator: ',',
    thousandsSeparator: '.',
    flag: '🇧🇷',
  },
  'en-US': {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English (US)',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    },
    dateLongFormat: {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    },
    monthYearFormat: {
      month: 'long',
      year: 'numeric'
    },
    numberFormat: { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    decimalSeparator: '.',
    thousandsSeparator: ',',
    flag: '🇺🇸',
  },
  'es-ES': {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    currency: 'EUR',
    currencySymbol: '€',
    dateFormat: { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    },
    dateLongFormat: {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    },
    monthYearFormat: {
      month: 'long',
      year: 'numeric'
    },
    numberFormat: { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    decimalSeparator: ',',
    thousandsSeparator: '.',
    flag: '🇪🇸',
  },
};

/**
 * Locale padrão do sistema
 */
export const DEFAULT_LOCALE: SupportedLocale = 'pt-BR';

/**
 * Lista de locales disponíveis para seletores de UI
 */
export const AVAILABLE_LOCALES = Object.values(LOCALES);

/**
 * Verifica se um código é um locale suportado
 */
export function isSupportedLocale(code: string): code is SupportedLocale {
  return code in LOCALES;
}

/**
 * Obtém a configuração de um locale, com fallback para pt-BR
 */
export function getLocaleConfig(code: string): LocaleConfig {
  if (isSupportedLocale(code)) {
    return LOCALES[code];
  }
  // Tenta match parcial (ex: 'pt' → 'pt-BR')
  const partial = Object.keys(LOCALES).find(k => k.startsWith(code.split('-')[0]));
  if (partial && isSupportedLocale(partial)) {
    return LOCALES[partial];
  }
  return LOCALES[DEFAULT_LOCALE];
}
