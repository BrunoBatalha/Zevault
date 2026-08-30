import { describe, expect, it } from 'vitest';
import { prepareImportedData } from './import-data';

const baseData = {
  accounts: [{ id: 1, name: 'Banco', type: 'bank', balance: 1000 }],
  categories: [],
  transactions: [],
};

describe('prepareImportedData', () => {
  it('remove tipo legado e vincula cartao quando existe uma unica conta', () => {
    const data = prepareImportedData({
      ...baseData,
      creditCards: [{ id: 2, name: 'Visa', limit: 5000, closingDay: 10, dueDay: 20 }],
    });

    expect(data.accounts[0]).not.toHaveProperty('type');
    expect(data.creditCards[0]).toMatchObject({ accountId: 1 });
  });

  it('rejeita cartao sem conta quando a associacao e ambigua', () => {
    expect(() => prepareImportedData({
      ...baseData,
      accounts: [...baseData.accounts, { id: 2, name: 'Outro banco', balance: 0 }],
      creditCards: [{ id: 3, name: 'Visa', limit: 5000, closingDay: 10, dueDay: 20 }],
    })).toThrow('Invalid credit card account');
  });

  it('rejeita antes da importacao quando o vinculo aponta para conta inexistente', () => {
    expect(() => prepareImportedData({
      ...baseData,
      creditCards: [{ id: 3, name: 'Visa', limit: 5000, closingDay: 10, dueDay: 20, accountId: 99 }],
    })).toThrow('Invalid credit card account');
  });

  it('rejeita uma transacao estruturalmente invalida antes de qualquer limpeza', () => {
    expect(() => prepareImportedData({
      ...baseData,
      transactions: [{ id: 4, amount: 'cem' }],
    })).toThrow('Invalid transaction');
  });
});
