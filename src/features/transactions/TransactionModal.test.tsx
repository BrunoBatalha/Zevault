import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionModal } from './TransactionModal'

vi.mock('@/core/hooks', () => ({ useData: vi.fn() }))
vi.mock('@/core/database', () => ({
  db: { add: vi.fn(), bulkAdd: vi.fn(), update: vi.fn(), get: vi.fn(), getAll: vi.fn(), replaceCreditCardPurchase: vi.fn(), updateCreditCardTransaction: vi.fn(), replaceFutureRecurringTransactions: vi.fn() },
}))
vi.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (k: string, options?: Record<string, unknown>) => options ? `${k}:${JSON.stringify(options)}` : k,
    formatCurrency: (value: number) => `R$ ${value}`,
  }),
}))

import { useData } from '@/core/hooks'
import { db } from '@/core/database'

const mockAccount = { id: 1, name: 'Banco', balance: 1000 }
const mockCard = { id: 1, name: 'Visa', limit: 5000, closingDay: 10, dueDay: 20, accountId: 1 }

// Referências estáveis para evitar re-renders infinitos no useEffect
const accountsList = [mockAccount]
const cardsList = [mockCard]
const EMPTY: never[] = []

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useData).mockImplementation((store) => {
    if (store === 'accounts') return accountsList as any
    if (store === 'creditCards') return cardsList as any
    return EMPTY as any
  })
  vi.mocked(db.add).mockResolvedValue(1 as any)
  vi.mocked(db.bulkAdd).mockResolvedValue(undefined as any)
  vi.mocked(db.get).mockResolvedValue(mockAccount as any)
  vi.mocked(db.update).mockResolvedValue(undefined as any)
  vi.mocked(db.getAll).mockResolvedValue([] as any)
  vi.mocked(db.replaceCreditCardPurchase).mockResolvedValue(undefined as any)
  vi.mocked(db.updateCreditCardTransaction).mockResolvedValue(undefined as any)
  vi.mocked(db.replaceFutureRecurringTransactions).mockResolvedValue(undefined as any)
})

describe('TransactionModal — despesa debito', () => {
  it('mantém despesa vermelha e receita verde sem depender do texto traduzido', async () => {
    render(<TransactionModal isOpen onClose={vi.fn()} />)
    const expense = screen.getByText('transactions.types.expense')
    const income = screen.getByText('transactions.types.income')

    expect(expense).toHaveClass('text-rose-600')
    expect(income).toHaveClass('text-emerald-600')
    await userEvent.click(income)
    expect(income).toHaveClass('text-emerald-600')
  })

  it('antecipa a redução no saldo antes de salvar', async () => {
    render(<TransactionModal isOpen onClose={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText('0,00'), '200')

    expect(screen.getByText(/transactions\.impact\.expense/)).toHaveTextContent('Banco')
    expect(screen.getByText(/transactions\.impact\.expense/)).toHaveTextContent('R$ 200')
  })

  it('fecha com Escape e devolve o foco ao elemento que abriu o modal', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<><button type="button">Abrir lançamento</button><TransactionModal isOpen={false} onClose={onClose} /></>)

    const trigger = screen.getByRole('button', { name: 'Abrir lançamento' })
    trigger.focus()
    rerender(<><button type="button">Abrir lançamento</button><TransactionModal isOpen onClose={onClose} /></>)
    await waitFor(() => expect(screen.getByRole('button', { name: 'common.close' })).toHaveFocus())
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
    rerender(<><button type="button">Abrir lançamento</button><TransactionModal isOpen={false} onClose={onClose} /></>)
    expect(trigger).toHaveFocus()
  })

  it('cria transacao e debita saldo da conta', async () => {
    const onClose = vi.fn()
    render(<TransactionModal isOpen onClose={onClose} />)

    await screen.findByText('transactions.modal.save')

    await userEvent.type(screen.getByPlaceholderText('0,00'), '200')
    await userEvent.type(
      screen.getByPlaceholderText('transactions.modal.descriptionPlaceholder'),
      'Padaria'
    )

    await userEvent.click(screen.getByText('transactions.modal.save'))
    await waitFor(() => {
      expect(db.add).toHaveBeenCalledWith(
        'transactions',
        expect.objectContaining({ amount: 200, type: 'expense' })
      )
      expect(db.update).toHaveBeenCalledWith('accounts', 1, { balance: 800 })
      expect(onClose).toHaveBeenCalled()
    })
  })
})

describe('TransactionModal — parcelamento cartao', () => {
  it('mostra o valor calculado em cada opção de parcela', async () => {
    render(<TransactionModal isOpen onClose={vi.fn()} />)
    const comboboxes = screen.getAllByRole('combobox')
    await userEvent.selectOptions(comboboxes[0], 'credit')
    await userEvent.type(screen.getByPlaceholderText('0,00'), '10')

    expect(screen.getByText(/"count":2/)).toHaveTextContent('R$ 5')
  })

  it('exibe o ajuste da última parcela fora do select', async () => {
    render(<TransactionModal isOpen onClose={vi.fn()} />)
    const comboboxes = screen.getAllByRole('combobox')
    await userEvent.selectOptions(comboboxes[0], 'credit')
    await userEvent.type(screen.getByPlaceholderText('0,00'), '100')
    await userEvent.selectOptions(screen.getAllByRole('combobox')[2], '3')

    expect(screen.getByText(/transactions\.modal\.lastInstallmentNotice/)).toHaveTextContent('R$ 33.34')
  })

  it('cria N transacoes para N parcelas', async () => {
    render(<TransactionModal isOpen onClose={vi.fn()} />)
    await screen.findByText('transactions.modal.save')

    // Trocar método para credit (primeiro combobox = method select)
    const comboboxes = screen.getAllByRole('combobox')
    await userEvent.selectOptions(comboboxes[0], 'credit')

    // Aguardar re-render com label de parcelas visível
    await screen.findByText('transactions.modal.installments')

    await userEvent.type(screen.getByPlaceholderText('0,00'), '300')
    await userEvent.type(
      screen.getByPlaceholderText('transactions.modal.descriptionPlaceholder'),
      'TV'
    )

    // Após credit: [method, card, installments, category, costcenter]
    const updatedComboboxes = screen.getAllByRole('combobox')
    await userEvent.selectOptions(updatedComboboxes[2], '3')

    await userEvent.click(screen.getByText('transactions.modal.save'))
    await waitFor(() => {
      expect(db.bulkAdd).toHaveBeenCalledWith(
        'transactions',
        expect.arrayContaining([
          expect.objectContaining({ amount: 100, isCreditCard: true, installmentTotal: 3 }),
        ]),
      )
    })
  })

  it('nao debita saldo no parcelamento de cartao', async () => {
    render(<TransactionModal isOpen onClose={vi.fn()} />)
    await screen.findByText('transactions.modal.save')

    const comboboxes = screen.getAllByRole('combobox')
    await userEvent.selectOptions(comboboxes[0], 'credit')
    await screen.findByText('transactions.modal.installments')

    await userEvent.type(screen.getByPlaceholderText('0,00'), '100')
    await userEvent.type(
      screen.getByPlaceholderText('transactions.modal.descriptionPlaceholder'),
      'Compra'
    )

    await userEvent.click(screen.getByText('transactions.modal.save'))
    await waitFor(() => {
      expect(db.update).not.toHaveBeenCalled()
    })
  })
})

describe('TransactionModal — modo edicao', () => {
  it('popula formulario com dados da transacao existente', () => {
    const tx = {
      id: 5,
      amount: 250,
      description: 'Netflix',
      type: 'expense' as const,
      date: '2026-01-01',
      status: 'paid' as const,
      accountId: 1,
      isCreditCard: false,
    }
    render(<TransactionModal isOpen onClose={vi.fn()} transactionToEdit={tx as any} />)
    expect(screen.getByDisplayValue('250')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument()
  })

  it('chama db.update (nao db.add) ao salvar edicao', async () => {
    const tx = {
      id: 5,
      amount: 250,
      description: 'Netflix',
      type: 'expense' as const,
      date: '2026-01-01',
      status: 'paid' as const,
      accountId: 1,
      isCreditCard: false,
    }
    render(<TransactionModal isOpen onClose={vi.fn()} transactionToEdit={tx as any} />)
    await userEvent.click(screen.getByText('transactions.modal.save'))
    await waitFor(() => {
      expect(db.update).toHaveBeenCalledWith('transactions', 5, expect.any(Object))
      expect(db.add).not.toHaveBeenCalled()
    })
  })

  it('refaz todas as parcelas a partir do valor total, data da compra e cartão', async () => {
    const installments = [
      { id: 5, amount: 100, description: 'Notebook (Parc. 1/2)', type: 'expense' as const, date: '2026-01-20', status: 'pending' as const, isCreditCard: true, creditCardId: 1, installmentCurrent: 1, installmentTotal: 2, groupId: 'purchase-1' },
      { id: 6, amount: 100, description: 'Notebook (Parc. 2/2)', type: 'expense' as const, date: '2026-02-20', status: 'pending' as const, isCreditCard: true, creditCardId: 1, installmentCurrent: 2, installmentTotal: 2, groupId: 'purchase-1' },
    ]
    const alternateCard = { id: 2, name: 'Mastercard', limit: 3000, closingDay: 15, dueDay: 5, accountId: 1 }
    const creditCardsForEdit = [mockCard, alternateCard]
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'accounts') return accountsList as any
      if (store === 'creditCards') return creditCardsForEdit as any
      if (store === 'transactions') return installments as any
      return EMPTY as any
    })
    const user = userEvent.setup()

    render(<TransactionModal isOpen onClose={vi.fn()} transactionToEdit={installments[0] as any} installmentEditScope="all" />)

    expect(screen.getByDisplayValue('Notebook')).toBeInTheDocument()
    expect(screen.getByDisplayValue('200')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-01-20')).not.toBeDisabled()

    await user.clear(screen.getByPlaceholderText('0,00'))
    await user.type(screen.getByPlaceholderText('0,00'), '301')
    await user.clear(screen.getByPlaceholderText('transactions.modal.descriptionPlaceholder'))
    await user.type(screen.getByPlaceholderText('transactions.modal.descriptionPlaceholder'), 'Computador')
    fireEvent.change(screen.getByDisplayValue('2026-01-20'), { target: { value: '2026-01-09' } })
    const comboboxes = screen.getAllByRole('combobox')
    await user.selectOptions(comboboxes[1], '2')
    await user.selectOptions(comboboxes[2], '3')
    await user.click(screen.getByText('transactions.modal.save'))

    await waitFor(() => {
      expect(db.replaceCreditCardPurchase).toHaveBeenCalledWith('purchase-1', [
        expect.objectContaining({ amount: 100.33, description: 'Computador (Parc. 1/3)', date: '2026-02-05', creditCardId: 2, status: 'pending' }),
        expect.objectContaining({ amount: 100.33, description: 'Computador (Parc. 2/3)', date: '2026-03-05', creditCardId: 2, status: 'pending' }),
        expect.objectContaining({ amount: 100.34, description: 'Computador (Parc. 3/3)', date: '2026-04-05', creditCardId: 2, status: 'pending' }),
      ])
    })
  })

  it('exibe o total exato ao editar uma compra em 12 parcelas', () => {
    const installments = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      amount: index === 0 ? 8.37 : 8.33,
      description: `Assinatura (Parc. ${index + 1}/12)`,
      type: 'expense' as const,
      date: `2026-${String(index + 1).padStart(2, '0')}-20`,
      status: 'pending' as const,
      isCreditCard: true,
      creditCardId: 1,
      installmentCurrent: index + 1,
      installmentTotal: 12,
      groupId: 'purchase-12',
    }))
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'accounts') return accountsList as any
      if (store === 'creditCards') return cardsList as any
      if (store === 'transactions') return installments as any
      return EMPTY as any
    })

    render(<TransactionModal isOpen onClose={vi.fn()} transactionToEdit={installments[0] as any} installmentEditScope="all" />)

    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })

  it('cria imediatamente as ocorrências recorrentes como pendentes sem alterar o saldo', async () => {
    const { container } = render(<TransactionModal isOpen onClose={vi.fn()} />)
    const user = userEvent.setup()
    const dateInputs = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    fireEvent.change(dateInputs[0], { target: { value: '2026-01-01' } })
    await user.type(screen.getByPlaceholderText('0,00'), '200')
    await user.type(screen.getByPlaceholderText('transactions.modal.descriptionPlaceholder'), 'Academia')

    const recurrenceLabel = screen.getByText('transactions.modal.recurrence.label')
    const recurrenceSelect = recurrenceLabel.parentElement!.querySelector('select')!
    await user.selectOptions(recurrenceSelect, 'weekly')
    const weekdayLabel = screen.getByText('transactions.modal.recurrence.weekday')
    await user.selectOptions(weekdayLabel.parentElement!.querySelector('select')!, '1')
    const recurrenceDates = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    fireEvent.change(recurrenceDates[1], { target: { value: '2026-01-12' } })

    await user.click(screen.getByText('transactions.modal.save'))
    await waitFor(() => expect(db.bulkAdd).toHaveBeenCalledWith('transactions', [
      expect.objectContaining({ date: '2026-01-05', status: 'pending', amount: 200, recurrence: expect.objectContaining({ frequency: 'weekly' }) }),
      expect.objectContaining({ date: '2026-01-12', status: 'pending', amount: 200 }),
    ]))
    expect(db.update).not.toHaveBeenCalled()
  })
})
