import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './use-theme'
import { STORAGE_KEYS } from '@/core/utils/constants'

// localStorage.clear() e document.documentElement.className = '' ja no setup.ts

describe('useTheme', () => {
  it('retorna tema default (light) sem localStorage', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('le tema salvo do localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('setTheme muda tema e aplica classe dark no documentElement', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('dark'))
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme alterna entre dark e light', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('persiste tema no localStorage apos setTheme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('dark'))
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark')
  })
})
