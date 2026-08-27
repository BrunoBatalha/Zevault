import { describe, it, expect } from 'vitest'
import { db } from './index'

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
    await db.add('accounts', { name: 'Banco X', type: 'bank', balance: 500 })
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ name: 'Banco X', balance: 500 })
  })

  it('get retorna registro por id', async () => {
    const id = await db.add('accounts', { name: 'Caixa', type: 'cash', balance: 0 })
    const item = await db.get('accounts', id)
    expect(item).toMatchObject({ name: 'Caixa' })
  })

  it('get retorna undefined para id inexistente', async () => {
    const item = await db.get('accounts', 9999)
    expect(item).toBeUndefined()
  })

  it('update modifica campos do registro', async () => {
    const id = await db.add('accounts', { name: 'Antes', type: 'bank', balance: 100 })
    await db.update('accounts', id, { balance: 200 })
    const item = await db.get<{ balance: number }>('accounts', id)
    expect(item?.balance).toBe(200)
  })

  it('update rejeita para id inexistente', async () => {
    await expect(db.update('accounts', 9999, { balance: 0 })).rejects.toThrow('Item not found')
  })

  it('delete remove o registro', async () => {
    const id = await db.add('accounts', { name: 'Del', type: 'cash', balance: 0 })
    await db.delete('accounts', id)
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(0)
  })

  it('clear remove todos os registros', async () => {
    await db.add('accounts', { name: 'A', type: 'cash', balance: 0 })
    await db.add('accounts', { name: 'B', type: 'cash', balance: 0 })
    await db.clear('accounts')
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(0)
  })

  it('bulkAdd insere multiplos registros', async () => {
    await db.bulkAdd('accounts', [
      { name: 'X', type: 'bank', balance: 0 },
      { name: 'Y', type: 'cash', balance: 0 },
    ])
    const items = await db.getAll('accounts')
    expect(items).toHaveLength(2)
  })
})

describe('NativeDB.subscribe', () => {
  it('notifica subscriber apos add', async () => {
    let called = 0
    const unsub = db.subscribe(() => { called++ })
    await db.add('accounts', { name: 'Z', type: 'cash', balance: 0 })
    expect(called).toBe(1)
    unsub()
  })

  it('nao notifica apos unsubscribe', async () => {
    let called = 0
    const unsub = db.subscribe(() => { called++ })
    unsub()
    await db.add('accounts', { name: 'W', type: 'cash', balance: 0 })
    expect(called).toBe(0)
  })
})
