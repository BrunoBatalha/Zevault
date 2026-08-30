import { describe, it, expect } from 'vitest'
import { DB_NAME } from '@/core/utils/constants'
import type { Account, CreditCard, Transaction } from '@/types'
import { db } from './index'
import { STORE_CONFIGS } from './stores'

// beforeEach já reseta indexedDB e db.db = null via setup.ts

describe('NativeDB.connect', () => {
  it('conecta e retorna IDBDatabase', async () => {
    const result = await db.connect()
    expect(result).toBeDefined()
  })
  it('retorna mesma instancia em chamadas subsequentes', async () => {
    const a = await db.connect()
    const b = await db.connect()
    expect(a).toBe(b)
  })
})

describe('NativeDB CRUD — accounts', () => {
  it('add e getAll retornam o registro criado', async () => {
    await db.add('accounts', { name: 'Banco X', balance: 500 })
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ name: 'Banco X', balance: 500 })
  })

  it('get retorna registro por id', async () => {
    const id = await db.add('accounts', { name: 'Caixa', balance: 0 })
    const item = await db.get('accounts', id)
    expect(item).toMatchObject({ name: 'Caixa' })
  })

  it('get retorna undefined para id inexistente', async () => {
    const item = await db.get('accounts', 9999)
    expect(item).toBeUndefined()
  })

  it('update modifica campos do registro', async () => {
    const id = await db.add('accounts', { name: 'Antes', balance: 100 })
    await db.update('accounts', id, { balance: 200 })
    const item = await db.get<{ balance: number }>('accounts', id)
    expect(item?.balance).toBe(200)
  })

  it('update rejeita para id inexistente', async () => {
    await expect(db.update('accounts', 9999, { balance: 0 })).rejects.toThrow('Item not found')
  })

  it('delete remove o registro', async () => {
    const id = await db.add('accounts', { name: 'Del', balance: 0 })
    await db.delete('accounts', id)
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(0)
  })

  it('clear remove todos os registros', async () => {
    await db.add('accounts', { name: 'A', balance: 0 })
    await db.add('accounts', { name: 'B', balance: 0 })
    await db.clear('accounts')
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(0)
  })

  it('bulkAdd insere multiplos registros', async () => {
    await db.bulkAdd('accounts', [
      { name: 'X', balance: 0 },
      { name: 'Y', balance: 0 },
    ])
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(2)
  })
})

describe('NativeDB — compra parcelada', () => {
  it('substitui uma série inteira sem tocar em transações de outro grupo', async () => {
    await db.add('transactions', { type: 'expense', amount: 50, description: 'Antiga (Parc. 1/2)', date: '2026-01-20', status: 'paid', isCreditCard: true, groupId: 'old-group' })
    await db.add('transactions', { type: 'expense', amount: 50, description: 'Antiga (Parc. 2/2)', date: '2026-02-20', status: 'pending', isCreditCard: true, groupId: 'old-group' })
    await db.add('transactions', { type: 'expense', amount: 25, description: 'Outra compra', date: '2026-01-20', status: 'pending', isCreditCard: true, groupId: 'other-group' })

    await db.replaceCreditCardPurchase('old-group', [
      { type: 'expense', amount: 100, description: 'Nova (Parc. 1/1)', date: '2026-03-20', status: 'pending', isCreditCard: true, groupId: 'old-group' },
    ])

    const transactions = await db.getAll<{ groupId: string; description: string; status: string }>('transactions')
    expect(transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ groupId: 'old-group', description: 'Nova (Parc. 1/1)', status: 'pending' }),
      expect.objectContaining({ groupId: 'other-group', description: 'Outra compra' }),
    ]))
    expect(transactions).toHaveLength(2)
  })

  it('debita ao pagar e estorna ao voltar uma parcela para pendente', async () => {
    const accountId = await db.add<Account>('accounts', { name: 'Banco', balance: 1000 })
    const transactionId = await db.add<Transaction>('transactions', {
      type: 'expense', amount: 125, description: 'Parcela', date: '2026-01-20',
      status: 'pending', isCreditCard: true, creditCardId: 1, accountId: null,
    })

    await db.changeCreditCardTransactionStatus(transactionId, 'paid', accountId)
    expect(await db.get<Account>('accounts', accountId)).toMatchObject({ balance: 875 })
    expect(await db.get<Transaction>('transactions', transactionId)).toMatchObject({ status: 'paid', accountId })

    await db.changeCreditCardTransactionStatus(transactionId, 'pending')
    expect(await db.get<Account>('accounts', accountId)).toMatchObject({ balance: 1000 })
    expect(await db.get<Transaction>('transactions', transactionId)).toMatchObject({ status: 'pending', accountId: null })
  })

  it('nao estorna parcela legada paga sem conta registrada', async () => {
    const accountId = await db.add<Account>('accounts', { name: 'Banco', balance: 1000 })
    const transactionId = await db.add<Transaction>('transactions', {
      type: 'expense', amount: 125, description: 'Legada', date: '2026-01-20',
      status: 'paid', isCreditCard: true, creditCardId: 1, accountId: null,
    })

    await db.changeCreditCardTransactionStatus(transactionId, 'pending')
    expect(await db.get<Account>('accounts', accountId)).toMatchObject({ balance: 1000 })
    expect(await db.get<Transaction>('transactions', transactionId)).toMatchObject({ status: 'pending', accountId: null })
  })

  it('estorna somente parcelas pagas que registraram debito ao excluir em lote', async () => {
    const accountId = await db.add<Account>('accounts', { name: 'Banco', balance: 700 })
    const paidId = await db.add<Transaction>('transactions', {
      type: 'expense', amount: 100, description: 'Paga', date: '2026-01-20', status: 'paid',
      isCreditCard: true, creditCardId: 1, accountId,
    })
    const legacyId = await db.add<Transaction>('transactions', {
      type: 'expense', amount: 200, description: 'Legada', date: '2026-02-20', status: 'paid',
      isCreditCard: true, creditCardId: 1, accountId: null,
    })
    const pendingId = await db.add<Transaction>('transactions', {
      type: 'expense', amount: 300, description: 'Pendente', date: '2026-03-20', status: 'pending',
      isCreditCard: true, creditCardId: 1, accountId: null,
    })

    await db.deleteCreditCardTransactions([paidId, legacyId, pendingId])
    expect(await db.get<Account>('accounts', accountId)).toMatchObject({ balance: 800 })
    expect(await db.getAll<Transaction>('transactions')).toHaveLength(0)
  })

  it('reconcilia valor e troca de conta ao editar parcela paga', async () => {
    const firstAccountId = await db.add<Account>('accounts', { name: 'Primeira', balance: 900 })
    const secondAccountId = await db.add<Account>('accounts', { name: 'Segunda', balance: 500 })
    const transactionId = await db.add<Transaction>('transactions', {
      type: 'expense', amount: 100, description: 'Paga', date: '2026-01-20', status: 'paid',
      isCreditCard: true, creditCardId: 1, accountId: firstAccountId,
    })

    await db.updateCreditCardTransaction(transactionId, { amount: 150, creditCardId: 2 }, secondAccountId)
    expect(await db.get<Account>('accounts', firstAccountId)).toMatchObject({ balance: 1000 })
    expect(await db.get<Account>('accounts', secondAccountId)).toMatchObject({ balance: 350 })
    expect(await db.get<Transaction>('transactions', transactionId)).toMatchObject({ amount: 150, creditCardId: 2, accountId: secondAccountId })
  })

  it('estorna parcelas debitadas antes de recriar a compra como pendente', async () => {
    const accountId = await db.add<Account>('accounts', { name: 'Banco', balance: 700 })
    await db.add<Transaction>('transactions', { type: 'expense', amount: 100, description: '1/2', date: '2026-01-20', status: 'paid', isCreditCard: true, groupId: 'group', accountId })
    await db.add<Transaction>('transactions', { type: 'expense', amount: 200, description: '2/2', date: '2026-02-20', status: 'paid', isCreditCard: true, groupId: 'group', accountId })

    await db.replaceCreditCardPurchase<Transaction>('group', [
      { type: 'expense', amount: 300, description: 'Nova', date: '2026-03-20', status: 'pending', isCreditCard: true, groupId: 'group', accountId: null },
    ])

    expect(await db.get<Account>('accounts', accountId)).toMatchObject({ balance: 1000 })
    expect(await db.getAll<Transaction>('transactions')).toEqual([
      expect.objectContaining({ description: 'Nova', status: 'pending' }),
    ])
  })
})

describe('NativeDB migration v3', () => {
  it('remove o tipo da conta e vincula cartao legado quando existe uma unica conta', async () => {
    const oldDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2)
      request.onupgradeneeded = () => {
        STORE_CONFIGS.forEach((store) => request.result.createObjectStore(store.name, {
          keyPath: store.keyPath,
          autoIncrement: store.autoIncrement,
        }))
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const transaction = oldDatabase.transaction(['accounts', 'creditCards'], 'readwrite')
      transaction.objectStore('accounts').add({ id: 7, name: 'Banco', type: 'bank', balance: 500 })
      transaction.objectStore('creditCards').add({ id: 9, name: 'Visa', limit: 1000, closingDay: 10, dueDay: 20 })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    oldDatabase.close()

    await db.connect()
    const account = await db.get<Account & { type?: string }>('accounts', 7)
    const card = await db.get<CreditCard>('creditCards', 9)
    expect(account).toMatchObject({ id: 7, name: 'Banco', balance: 500 })
    expect(account).not.toHaveProperty('type')
    expect(card).toMatchObject({ accountId: 7 })
  })
})

describe('NativeDB.subscribe', () => {
  it('notifica subscriber apos add', async () => {
    let called = 0
    const unsub = db.subscribe(() => { called++ })
    await db.add('accounts', { name: 'Z', balance: 0 })
    expect(called).toBe(1)
    unsub()
  })

  it('nao notifica apos unsubscribe', async () => {
    let called = 0
    const unsub = db.subscribe(() => { called++ })
    unsub()
    await db.add('accounts', { name: 'W', balance: 0 })
    expect(called).toBe(0)
  })
})

describe('NativeDB.replaceAllData', () => {
  it('substitui os cinco stores preservando ids', async () => {
    await db.add('accounts', { name: 'Antiga', balance: 1 })
    await db.replaceAllData({
      accounts: [{ id: 9, name: 'Nova', balance: 500 }],
      categories: [{ id: 8, name: 'Receita', type: 'income' }],
      costCenters: [{ id: 7, name: 'Casa', budget: 1000 }],
      creditCards: [{ id: 6, name: 'Visa', limit: 2000, closingDay: 10, dueDay: 20, accountId: 9 }],
      transactions: [{ id: 5, type: 'expense', amount: 10, description: 'Compra', date: '2026-01-01', status: 'pending', accountId: 9 }],
    })

    expect(await db.getAll('accounts')).toEqual([{ id: 9, name: 'Nova', balance: 500 }])
    expect(await db.getAll('categories')).toHaveLength(1)
    expect(await db.getAll('costCenters')).toHaveLength(1)
    expect(await db.getAll('creditCards')).toHaveLength(1)
    expect(await db.getAll('transactions')).toHaveLength(1)
  })
})
