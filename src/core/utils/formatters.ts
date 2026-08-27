/**
 * Funções de formatação de dados
 */

/**
 * Formata um número como moeda brasileira (BRL)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda (ex: "R$ 1.234,56")
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value);
};

/**
 * Formata uma data no formato YYYY-MM-DD para o formato brasileiro
 * @param dateString - String de data no formato YYYY-MM-DD
 * @returns String formatada como data brasileira (ex: "25/12/2025")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Fix timezone issue by parsing YYYY-MM-DD explicitly
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR');
};

/**
 * Formata um número como porcentagem
 * @param value - Valor numérico (0-1 para 0%-100%)
 * @param decimals - Número de casas decimais (padrão: 2)
 * @returns String formatada como porcentagem (ex: "75,50%")
 */
export const formatPercentage = (value: number, decimals = 2): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Formata uma data ISO para formato brasileiro com hora
 * @param dateString - String de data ISO
 * @returns String formatada (ex: "25/12/2025 às 14:30")
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString('pt-BR');
  const timePart = date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${datePart} às ${timePart}`;
};

/**
 * Formata um número com separadores de milhares
 * @param value - Valor numérico
 * @returns String formatada (ex: "1.234.567")
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};
