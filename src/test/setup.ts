import '@testing-library/jest-dom'
import { IDBFactory } from 'fake-indexeddb'
import { db } from '@/core/database'

beforeEach(() => {
  global.indexedDB = new IDBFactory()
  // Forçar reconexão do singleton NativeDB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(db as any).db = null
  localStorage.clear()
  document.documentElement.className = ''
})
