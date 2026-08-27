import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionModal } from './TransactionModal'

vi.mock('@/core/hooks', () => ({ useData: vi.fn() }))
vi.mock('@/core/database', () => ({
  db: { add: vi.fn(), update: vi.fn(), get: vi.fn() },
}))
vi.mock('@/core/i18n', () => ({
  useI18n: () => ({ t: (k: string) => k }),
}))

import { useData } from '@/core/hooks'
import { db } from '@/core/database'

const mockAccount = { id: 1, name: 'Banco', type: 'bank', balance: 1000 }
const mockCard = { id: 1, name: 'Visa', limit: 5000, closingDay: 10, dueDay: 20 }

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
  vi.mocked(db.get).mockResolvedValue(mockAccount as any)
  vi.mocked(db.update).mockResolvedValue(undefined as any)
})

describe('TransactionModal — despesa debito', () => {
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
      expect(db.add).toHaveBeenCalledTimes(3)
      expect(db.add).toHaveBeenCalledWith(
        'transactions',
        expect.objectContaining({
          amount: 100,
          isCreditCard: true,
          installmentTotal: 3,
        })
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
})
