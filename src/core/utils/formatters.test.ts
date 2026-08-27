import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatPercentage, formatDateTime, formatNumber } from './formatters'

describe('formatCurrency', () => {
  it('formata valor positivo em BRL', () => {
    expect(formatCurrency(1234.56)).toBe('R$\u00a01.234,56')
  })
  it('formata zero', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00')
  })
  it('formata valor negativo', () => {
    expect(formatCurrency(-500)).toContain('500')
  })
})

describe('formatDate', () => {
  it('formata data YYYY-MM-DD em dd/mm/aaaa', () => {
    expect(formatDate('2026-01-15')).toBe('15/01/2026')
  })
  it('retorna string vazia para input vazio', () => {
    expect(formatDate('')).toBe('')
  })
  it('nao tem problema de timezone (dia correto)', () => {
    expect(formatDate('2026-03-01')).toBe('01/03/2026')
  })
})

describe('formatPercentage', () => {
  it('formata 0.75 como 75,00%', () => {
    expect(formatPercentage(0.75)).toBe('75,00%')
  })
  it('respeita decimals customizado', () => {
    expect(formatPercentage(0.5, 0)).toBe('50%')
  })
})

describe('formatDateTime', () => {
  it('retorna string vazia para input vazio', () => {
    expect(formatDateTime('')).toBe('')
  })
  it('formata data ISO com separador "as"', () => {
    const result = formatDateTime('2026-01-15T14:30:00')
    expect(result).toContain('15/01/2026')
    expect(result).toContain('às')
  })
})

describe('formatNumber', () => {
  it('formata com separadores de milhar', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })
})
