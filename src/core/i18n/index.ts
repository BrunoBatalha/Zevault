/**
 * @file index.ts
 * @description Configuração principal do i18next para internacionalização
 * 
 * Suporta 3 idiomas: pt-BR (padrão), en-US, es-ES
 * Inclui detecção automática de idioma e pluralização
 */

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';
import ptBR from './locales/pt-BR.json';

// Re-exporta tipos e hooks para facilitar imports
export { useI18n } from './hooks/use-i18n';
export * from './types';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'es-ES': { translation: esES },
    },
    
    // Idioma padrão (fallback)
    fallbackLng: 'pt-BR',
    
    // Suporte a namespaces (para futuro split de traduções)
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Interpolação
    interpolation: {
      escapeValue: false, // React já protege contra XSS
      formatSeparator: ',',
    },
    
    // Pluralização
    // i18next usa sufixos: _one, _other (pt-BR/en-US)
    // Para português: singular usa _one, plural usa _other
    pluralSeparator: '_',
    
    // Detecção automática de idioma
    detection: {
      // Ordem de prioridade para detectar o idioma
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Onde salvar a preferência
      caches: ['localStorage'],
      // Chave do localStorage
      lookupLocalStorage: 'i18nextLng',
    },
    
    // React específico
    react: {
      useSuspense: false, // Evita problemas com SSR/carregamento
      bindI18n: 'languageChanged',
      bindI18nStore: '',
    },
    
    // Debug (desabilitar em produção)
    debug: false,
  });

// Atualiza o atributo lang do HTML quando o idioma mudar
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

// Define o lang inicial
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || 'pt-BR';
}

export default i18n;
