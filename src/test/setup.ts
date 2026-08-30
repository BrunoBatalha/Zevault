import '@testing-library/jest-dom'
import { IDBFactory } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'
import { db } from '@/core/database'

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })

beforeEach(() => {
  global.indexedDB = new IDBFactory()
  // Forçar reconexão do singleton NativeDB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db as any).db = null
  if (typeof localStorage !== 'undefined') localStorage.clear()
  if (typeof document !== 'undefined') document.documentElement.className = ''
})
