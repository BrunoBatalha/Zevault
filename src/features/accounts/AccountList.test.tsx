import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountList } from './AccountList';

vi.mock('@/core/hooks', () => ({ useData: vi.fn() }));
vi.mock('@/core/database', () => ({ db: { delete: vi.fn() } }));
vi.mock('@/core/i18n', () => ({
  useI18n: () => ({
    t: (key: string, options?: Record<string, unknown>) => options ? `${key}:${JSON.stringify(options)}` : key,
    formatCurrency: (value: number) => `R$ ${value}`,
  }),
}));

import { db } from '@/core/database';
import { useData } from '@/core/hooks';

const account = { id: 1, name: 'Banco principal', balance: 1000 };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useData).mockImplementation((store) => {
    if (store === 'accounts') return [account] as never;
    if (store === 'creditCards') return [] as never;
    return [] as never;
  });
  vi.mocked(db.delete).mockResolvedValue(undefined as never);
});

describe('AccountList', () => {
  it('bloqueia exclusao quando a conta esta vinculada a cartao', async () => {
    vi.mocked(useData).mockImplementation((store) => {
      if (store === 'accounts') return [account] as never;
      if (store === 'creditCards') return [{ id: 2, name: 'Visa', accountId: 1 }] as never;
      return [] as never;
    });
    render(<AccountList />);

    await userEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(screen.getByText('accounts.linkedDeleteTitle')).toBeInTheDocument();
    expect(screen.getByText(/accounts\.linkedDeleteMessage/)).toHaveTextContent('Visa');
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('mantem a exclusao para conta sem cartao vinculado', async () => {
    render(<AccountList />);
    await userEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => expect(db.delete).toHaveBeenCalledWith('accounts', 1));
  });
});
