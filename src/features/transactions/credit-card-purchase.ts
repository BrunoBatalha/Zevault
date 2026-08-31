import type { CreditCard, Transaction, TransactionRecurrence } from '@/types';

export interface CreditCardPurchaseInput {
  totalAmount: number;
  purchaseDate: string;
  description: string;
  installments: number;
  creditCardId: number;
  groupId: string;
  categoryId: number | null;
  costCenterId: number | null;
  recurrence?: TransactionRecurrence;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const splitAmountInCents = (totalAmount: number, installments: number) => {
  const totalCents = Math.round(totalAmount * 100);
  if (installments === 1) return [totalCents / 100];

  const roundedInstallmentCents = Math.round(totalCents / installments);
  const firstInstallments = Array.from(
    { length: installments - 1 },
    () => roundedInstallmentCents / 100,
  );
  const lastInstallmentCents = totalCents - roundedInstallmentCents * (installments - 1);

  return [...firstInstallments, lastInstallmentCents / 100];
};

export const sumAmountsInCents = (amounts: number[]) =>
  amounts.reduce((totalCents, amount) => totalCents + Math.round(amount * 100), 0) / 100;

export const buildCreditCardPurchaseInstallments = (
  card: CreditCard,
  input: CreditCardPurchaseInput,
): Array<Omit<Transaction, 'id'>> => {
  const purchaseDate = new Date(`${input.purchaseDate}T00:00:00`);
  let invoiceMonth = purchaseDate.getMonth();
  let invoiceYear = purchaseDate.getFullYear();

  if (purchaseDate.getDate() >= card.closingDay) {
    invoiceMonth += 1;
  }
  if (invoiceMonth > 11) {
    invoiceMonth = 0;
    invoiceYear += 1;
  }

  const firstDueMonth = invoiceMonth + (card.dueDay < card.closingDay ? 1 : 0);
  const amounts = splitAmountInCents(input.totalAmount, input.installments);

  return amounts.map((amount, index) => ({
    amount,
    accountId: null,
    creditCardId: input.creditCardId,
    date: formatLocalDate(new Date(invoiceYear, firstDueMonth + index, card.dueDay)),
    description: `${input.description} (Parc. ${index + 1}/${input.installments})`,
    status: 'pending',
    type: 'expense',
    isCreditCard: true,
    installmentCurrent: index + 1,
    installmentTotal: input.installments,
    groupId: input.groupId,
    purchaseDate: input.purchaseDate,
    categoryId: input.categoryId,
    costCenterId: input.costCenterId,
    recurrence: input.recurrence,
  }));
};
