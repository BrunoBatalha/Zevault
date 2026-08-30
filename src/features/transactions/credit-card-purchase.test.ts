import { describe, expect, it } from 'vitest';
import { buildCreditCardPurchaseInstallments, splitAmountInCents, sumAmountsInCents } from './credit-card-purchase';

const card = { id: 1, name: 'Visa', limit: 5000, closingDay: 10, dueDay: 20, accountId: 1 };

describe('buildCreditCardPurchaseInstallments', () => {
  it('calcula vencimentos após o fechamento e divide o total em centavos exatos', () => {
    const installments = buildCreditCardPurchaseInstallments(card, {
      totalAmount: 100,
      purchaseDate: '2026-01-10',
      description: 'Curso',
      installments: 3,
      creditCardId: 1,
      groupId: 'group-1',
      categoryId: null,
      costCenterId: null,
    });

    expect(installments).toMatchObject([
      { amount: 33.33, date: '2026-02-20', description: 'Curso (Parc. 1/3)', status: 'pending', groupId: 'group-1' },
      { amount: 33.33, date: '2026-03-20', description: 'Curso (Parc. 2/3)' },
      { amount: 33.34, date: '2026-04-20', description: 'Curso (Parc. 3/3)' },
    ]);
    expect(installments.reduce((total, installment) => total + installment.amount, 0)).toBe(100);
  });

  it('considera o vencimento do mês seguinte quando ele vem antes do fechamento', () => {
    const installments = buildCreditCardPurchaseInstallments(
      { ...card, closingDay: 20, dueDay: 10 },
      {
        totalAmount: 90,
        purchaseDate: '2026-01-05',
        description: 'Seguro',
        installments: 1,
        creditCardId: 1,
        groupId: 'group-2',
        categoryId: null,
        costCenterId: null,
      },
    );

    expect(installments[0].date).toBe('2026-02-10');
  });

  it('soma parcelas em centavos sem resíduo de ponto flutuante', () => {
    const installments = buildCreditCardPurchaseInstallments(card, {
      totalAmount: 100,
      purchaseDate: '2026-01-01',
      description: 'Assinatura',
      installments: 12,
      creditCardId: 1,
      groupId: 'group-3',
      categoryId: null,
      costCenterId: null,
    });

    expect(sumAmountsInCents(installments.map((installment) => installment.amount))).toBe(100);
  });

  it('calcula o valor exibido de cada parcela com precisão em centavos', () => {
    expect(splitAmountInCents(10, 2)).toEqual([5, 5]);
    expect(splitAmountInCents(100, 3)).toEqual([33.33, 33.33, 33.34]);
  });
});
