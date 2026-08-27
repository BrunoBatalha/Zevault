import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionList } from './TransactionList'

vi.mock('@/core/hooks', () => ({
  useData: vi.fn(),
}))
vi.mock('@/core/database', () => ({
  db: {
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
  },
}))
vi.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (k: string) => k,
    formatCurrency: (v: number) => `R$ ${v}`,
  }),
}))

import { useData } from '@/core/hooks'
import { db } from '@/core/database'

const mockTransactions = [
  { id: 1, type: 'expense', amount: 100, description: 'Mercado', date: '2026-01-15', status: 'paid', accountId: 1 },
  { id: 2, type: 'income', amount: 500, description: 'Salário', date: '2026-01-10', status: 'paid', accountId: 1 },
  { id: 3, type: 'expense', amount: 200, description: 'Farmácia', date: '2026-01-20', status: 'pending', accountId: 1 },
]

// Referências estáveis para evitar re-renders infinitos no useEffect de componentes internos
const EMPTY: never[] = []

beforeEach(() => {
  vi.mocked(useData).mockImplementation((store) => {
    if (store === 'transactions') return mockTransactions as any
    return EMPTY as any
  })
  vi.mocked(db.get).mockResolvedValue({ id: 1, balance: 1000 } as any)
  vi.mocked(db.update).mockResolvedValue(undefined as any)
  vi.mocked(db.delete).mockResolvedValue(undefined as any)
  vi.mocked(db.getAll).mockResolvedValue(mockTransactions as any)
})

describe('TransactionList — filtragem', () => {
  it('exibe todas as transacoes por default', async () => {
    render(<TransactionList />)
    await waitFor(() => {
      expect(screen.getByText('Mercado')).toBeInTheDocument()
      expect(screen.getByText('Salário')).toBeInTheDocument()
    })
  })

  it('filtra por busca textual', async () => {
    render(<TransactionList />)
    const input = screen.getByPlaceholderText('transactions.search')
    await userEvent.type(input, 'Mercado')
    await waitFor(() => {
      expect(screen.getByText('Mercado')).toBeInTheDocument()
      expect(screen.queryByText('Salário')).not.toBeInTheDocument()
    })
  })

  it('filtra por tipo expense', async () => {
    render(<TransactionList />)
    const select = screen.getAllByRole('combobox')[0]
    await userEvent.selectOptions(select, 'expense')
    await waitFor(() => {
      expect(screen.getByText('Mercado')).toBeInTheDocument()
      expect(screen.queryByText('Salário')).not.toBeInTheDocument()
    })
  })

  it('filtra por status pending', async () => {
    render(<TransactionList />)
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[1], 'pending')
    await waitFor(() => {
      expect(screen.getByText('Farmácia')).toBeInTheDocument()
      expect(screen.queryByText('Mercado')).not.toBeInTheDocument()
    })
  })
})

describe('TransactionList — delete', () => {
  it('chama db.delete ao confirmar exclusao simples', async () => {
    // Usar apenas Mercado para simplificar localização do botão
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return [mockTransactions[0]] as any
      return EMPTY as any
    })
    render(<TransactionList />)
    await waitFor(() => expect(screen.getByText('Mercado')).toBeInTheDocument())

    // Botões: [0] new, [1] list-view, [2] monthly-view, [3] MoreVertical de Mercado
    const allButtons = screen.getAllByRole('button')
    await userEvent.click(allButtons[3])
    await userEvent.click(screen.getByText('common.delete'))
    await userEvent.click(screen.getByText('common.confirm'))

    expect(db.delete).toHaveBeenCalledWith('transactions', 1)
  })

  it('reverte saldo ao deletar transacao paga (expense)', async () => {
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return [mockTransactions[0]] as any // Mercado: paid expense 100
      return EMPTY as any
    })
    render(<TransactionList />)
    await waitFor(() => expect(screen.getByText('Mercado')).toBeInTheDocument())

    const allButtons = screen.getAllByRole('button')
    await userEvent.click(allButtons[3])
    await userEvent.click(screen.getByText('common.delete'))
    await userEvent.click(screen.getByText('common.confirm'))

    // Saldo deve aumentar (despesa revertida): 1000 + 100 = 1100
    expect(db.update).toHaveBeenCalledWith('accounts', 1, { balance: 1100 })
  })
})
