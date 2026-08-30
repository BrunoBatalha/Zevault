import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useData } from './use-data'
import { db } from '@/core/database'

describe('useData', () => {
  it('retorna array vazio inicialmente', async () => {
    const { result } = renderHook(() => useData('accounts'))
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it('retorna dados existentes do store', async () => {
    await db.add('accounts', { name: 'Banco', balance: 0 })
    const { result } = renderHook(() => useData('accounts'))
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0]).toMatchObject({ name: 'Banco' })
  })

  it('atualiza automaticamente apos add (reatividade)', async () => {
    const { result } = renderHook(() => useData('accounts'))
    await waitFor(() => expect(result.current).toEqual([]))
    await db.add('accounts', { name: 'Novo', balance: 50 })
    await waitFor(() => expect(result.current).toHaveLength(1))
  })

  it('atualiza apos delete', async () => {
    const id = await db.add('accounts', { name: 'Del', balance: 0 })
    const { result } = renderHook(() => useData('accounts'))
    await waitFor(() => expect(result.current).toHaveLength(1))
    await db.delete('accounts', id)
    await waitFor(() => expect(result.current).toHaveLength(0))
  })
})
