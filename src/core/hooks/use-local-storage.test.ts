import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './use-local-storage'

// localStorage.clear() ja é chamado no setup.ts

describe('useLocalStorage', () => {
  it('retorna valor inicial quando key nao existe', () => {
    const { result } = renderHook(() => useLocalStorage('k1', 42))
    expect(result.current[0]).toBe(42)
  })

  it('persiste valor no localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('k2', ''))
    act(() => result.current[1]('hello'))
    expect(localStorage.getItem('k2')).toBe('"hello"')
  })

  it('le valor existente do localStorage', () => {
    localStorage.setItem('k3', JSON.stringify({ x: 1 }))
    const { result } = renderHook(() => useLocalStorage('k3', {}))
    expect(result.current[0]).toEqual({ x: 1 })
  })

  it('aceita updater function (mesma API do useState)', () => {
    const { result } = renderHook(() => useLocalStorage('k4', 0))
    act(() => result.current[1]((prev) => prev + 5))
    expect(result.current[0]).toBe(5)
  })

  it('sincroniza com evento storage de outra aba', () => {
    const { result } = renderHook(() => useLocalStorage('k5', 'antes'))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'k5', newValue: '"depois"' }))
    })
    expect(result.current[0]).toBe('depois')
  })
})
