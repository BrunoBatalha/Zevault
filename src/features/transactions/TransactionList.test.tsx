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
    changeCreditCardTransactionStatus: vi.fn(),
    deleteCreditCardTransactions: vi.fn(),
  },
}))
vi.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (k: string, options?: Record<string, unknown>) => options ? `${k}:${JSON.stringify(options)}` : k,
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
const statusAccounts = [{ id: 1, name: 'Conta principal', balance: 1000 }]
const transferAccounts = [
  { id: 1, name: 'Origem', balance: 1000 },
  { id: 2, name: 'Destino', balance: 500 },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useData).mockImplementation((store) => {
    if (store === 'transactions') return mockTransactions as any
    return EMPTY as any
  })
  vi.mocked(db.get).mockResolvedValue({ id: 1, balance: 1000 } as any)
  vi.mocked(db.update).mockResolvedValue(undefined as any)
  vi.mocked(db.delete).mockResolvedValue(undefined as any)
  vi.mocked(db.changeCreditCardTransactionStatus).mockResolvedValue(undefined as any)
  vi.mocked(db.deleteCreditCardTransactions).mockResolvedValue(undefined as any)
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

describe('TransactionList — edição de parcelas', () => {
  it('oferece editar somente o registro ou todos os registros da compra', async () => {
    const installment = {
      id: 10,
      type: 'expense' as const,
      amount: 100,
      description: 'Notebook (Parc. 1/2)',
      date: '2026-01-20',
      status: 'pending' as const,
      isCreditCard: true,
      creditCardId: 1,
      installmentCurrent: 1,
      installmentTotal: 2,
      groupId: 'purchase-1',
    }
    const visibleTransactions = [installment]
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return visibleTransactions as any
      return EMPTY as any
    })

    render(<TransactionList />)
    await waitFor(() => expect(screen.getByText('Notebook (Parc. 1/2)')).toBeInTheDocument())

    await userEvent.click(screen.getAllByRole('button')[3])
    await userEvent.click(screen.getByText('common.edit'))

    expect(screen.getByText('transactions.editInstallment.single')).toBeInTheDocument()
    expect(screen.getByText('transactions.editInstallment.all')).toBeInTheDocument()
  })

  it('exclui a compra completa, inclusive parcelas já pagas', async () => {
    const installments = [
      { id: 10, type: 'expense' as const, amount: 100, description: 'Notebook (Parc. 1/2)', date: '2026-01-20', status: 'paid', isCreditCard: true, creditCardId: 1, installmentCurrent: 1, installmentTotal: 2, groupId: 'purchase-1' },
      { id: 11, type: 'expense' as const, amount: 100, description: 'Notebook (Parc. 2/2)', date: '2026-02-20', status: 'pending', isCreditCard: true, creditCardId: 1, installmentCurrent: 2, installmentTotal: 2, groupId: 'purchase-1' },
    ]
    const visibleTransactions = [installments[0]]
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return visibleTransactions as any
      return EMPTY as any
    })
    vi.mocked(db.getAll).mockResolvedValue(installments as any)

    render(<TransactionList />)
    await waitFor(() => expect(screen.getByText('Notebook (Parc. 1/2)')).toBeInTheDocument())

    await userEvent.click(screen.getAllByRole('button')[3])
    await userEvent.click(screen.getByText('common.delete'))
    await userEvent.click(screen.getByText('transactions.deleteInstallment.all'))

    await waitFor(() => expect(db.deleteCreditCardTransactions).toHaveBeenCalledWith([10, 11]))
  })

  it('renderiza o menu de ações fora do contêiner rolável da tabela', async () => {
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return [mockTransactions[0]] as never
      return EMPTY as never
    })

    render(<TransactionList />)
    await userEvent.click(screen.getByRole('button', { name: 'common.actions' }))

    const menu = screen.getByRole('menu')
    expect(menu).toHaveClass('fixed')
    expect(menu.closest('.overflow-x-auto')).toBeNull()
  })
})

describe('TransactionList — mudança de status', () => {
  it('debita a conta vinculada ao marcar parcela do cartao como paga', async () => {
    const installment = {
      id: 20, type: 'expense' as const, amount: 120, description: 'Parcela', date: '2026-01-20',
      status: 'pending' as const, isCreditCard: true, creditCardId: 5, accountId: null,
    }
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return [installment] as never
      if (store === 'accounts') return statusAccounts as never
      if (store === 'creditCards') return [{ id: 5, name: 'Visa', accountId: 1 }] as never
      return EMPTY as never
    })
    render(<TransactionList />)

    await userEvent.click(screen.getByRole('button', { name: 'common.actions' }))
    await userEvent.click(screen.getByText('transactions.actions.markPaid'))
    expect(screen.getByText(/transactions\.statusChange\.payCreditCard/)).toHaveTextContent('Conta principal')
    await userEvent.click(screen.getByText('transactions.actions.markPaid'))

    await waitFor(() => expect(db.changeCreditCardTransactionStatus).toHaveBeenCalledWith(20, 'paid', 1))
  })

  it('bloqueia pagamento de parcela quando o cartao legado nao tem conta', async () => {
    const installment = {
      id: 21, type: 'expense' as const, amount: 120, description: 'Parcela legada', date: '2026-01-20',
      status: 'pending' as const, isCreditCard: true, creditCardId: 6, accountId: null,
    }
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return [installment] as never
      if (store === 'accounts') return statusAccounts as never
      if (store === 'creditCards') return [{ id: 6, name: 'Legado', accountId: null }] as never
      return EMPTY as never
    })
    render(<TransactionList />)

    await userEvent.click(screen.getByRole('button', { name: 'common.actions' }))
    await userEvent.click(screen.getByText('transactions.actions.markPaid'))
    expect(screen.getByText('transactions.statusChange.creditCardMissingAccount')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'common.close' }))

    expect(db.changeCreditCardTransactionStatus).not.toHaveBeenCalled()
  })

  it('explica o efeito no saldo e exige confirmação antes de marcar como pago', async () => {
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return [mockTransactions[2]] as never
      if (store === 'accounts') return statusAccounts as never
      return EMPTY as never
    })
    render(<TransactionList />)

    await waitFor(() => expect(screen.getByText('Farmácia')).toBeInTheDocument())
    await userEvent.click(screen.getAllByRole('button')[3])
    await userEvent.click(screen.getByText('transactions.actions.markPaid'))

    expect(screen.getByText('transactions.statusChange.title.paid')).toBeInTheDocument()
    expect(screen.getByText(/transactions\.statusChange\.payExpense/)).toHaveTextContent('Conta principal')
    expect(db.update).not.toHaveBeenCalled()

    await userEvent.click(screen.getByText('transactions.actions.markPaid'))
    await waitFor(() => {
      expect(db.update).toHaveBeenCalledWith('transactions', 3, { status: 'paid' })
      expect(db.update).toHaveBeenCalledWith('accounts', 1, { balance: 800 })
    })
  })

  it('aplica uma transferência paga nas duas contas após a confirmação', async () => {
    const transfer = { id: 4, type: 'transfer' as const, amount: 100, description: 'Reserva', date: '2026-01-21', status: 'pending' as const, accountId: 1, toAccountId: 2 }
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'transactions') return [transfer] as never
      if (store === 'accounts') return transferAccounts as never
      return EMPTY as never
    })
    vi.mocked(db.get)
      .mockResolvedValueOnce(transferAccounts[0] as never)
      .mockResolvedValueOnce(transferAccounts[1] as never)

    render(<TransactionList />)

    await waitFor(() => expect(screen.getByText('Reserva')).toBeInTheDocument())
    await userEvent.click(screen.getAllByRole('button')[3])
    await userEvent.click(screen.getByText('transactions.actions.markPaid'))

    expect(screen.getByText(/transactions\.statusChange\.payTransfer/)).toHaveTextContent('Origem')
    expect(screen.getByText(/transactions\.statusChange\.payTransfer/)).toHaveTextContent('Destino')

    await userEvent.click(screen.getByText('transactions.actions.markPaid'))
    await waitFor(() => {
      expect(db.update).toHaveBeenCalledWith('accounts', 1, { balance: 900 })
      expect(db.update).toHaveBeenCalledWith('accounts', 2, { balance: 600 })
    })
  })

  it('exibe a lista de transações antes do resumo na visão mensal', async () => {
    render(<TransactionList />)

    // Botões: [0] new, [1] list-view, [2] monthly-view
    await userEvent.click(screen.getAllByRole('button')[2])
    for (let month = 0; month < 7; month += 1) {
      await userEvent.click(screen.getAllByRole('button')[3])
    }

    await waitFor(() => expect(screen.getByText('Mercado')).toBeInTheDocument())

    const pageText = document.body.textContent ?? ''
    expect(pageText.indexOf('Mercado')).toBeLessThan(pageText.indexOf('+R$ 500'))
  })
})
