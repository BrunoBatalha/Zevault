import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreditCardModal } from './CreditCardModal';

vi.mock('@/core/hooks', () => ({ useData: vi.fn() }));
vi.mock('@/core/database', () => ({ db: { add: vi.fn(), update: vi.fn() } }));
vi.mock('@/core/i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

import { db } from '@/core/database';
import { useData } from '@/core/hooks';

const accounts = [{ id: 1, name: 'Banco principal', balance: 1000 }];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useData).mockReturnValue(accounts as never);
  vi.mocked(db.add).mockResolvedValue(1 as never);
  vi.mocked(db.update).mockResolvedValue(undefined as never);
});

describe('CreditCardModal', () => {
  it('salva um novo cartao com conta obrigatoria', async () => {
    render(<CreditCardModal isOpen onClose={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('creditCards.modal.namePlaceholder'), 'Visa');
    await userEvent.click(screen.getByRole('button', { name: 'creditCards.modal.save' }));

    await waitFor(() => expect(db.add).toHaveBeenCalledWith('creditCards', expect.objectContaining({
      name: 'Visa',
      accountId: 1,
    })));
  });

  it('bloqueia o cadastro quando nao existe conta', () => {
    vi.mocked(useData).mockReturnValue([] as never);
    render(<CreditCardModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('creditCards.modal.noAccounts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'creditCards.modal.save' })).toBeDisabled();
  });

  it('exige corrigir um cartao legado sem conta ao editar', async () => {
    render(<CreditCardModal
      isOpen
      onClose={vi.fn()}
      cardToEdit={{ id: 5, name: 'Legado', limit: 1000, closingDay: 10, dueDay: 20, accountId: null }}
    />);

    expect(screen.getByRole('button', { name: 'creditCards.modal.save' })).toBeDisabled();
    await userEvent.selectOptions(screen.getByRole('combobox'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'creditCards.modal.save' }));

    await waitFor(() => expect(db.update).toHaveBeenCalledWith('creditCards', 5, expect.objectContaining({ accountId: 1 })));
  });
});
