import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

const variants = ['default', 'success', 'warning', 'danger', 'info', 'income', 'expense', 'transfer', 'paid', 'pending', 'bank', 'cash', 'card'] as const

describe('Badge', () => {
  it('renderiza children', () => {
    render(<Badge>Texto</Badge>)
    expect(screen.getByText('Texto')).toBeInTheDocument()
  })

  it('variant default aplica classes corretas', () => {
    render(<Badge variant="default">X</Badge>)
    expect(screen.getByText('X')).toHaveClass('bg-slate-100')
  })

  it('variant success aplica bg-emerald', () => {
    render(<Badge variant="success">X</Badge>)
    expect(screen.getByText('X')).toHaveClass('bg-emerald-50')
  })

  it('variant danger aplica bg-rose', () => {
    render(<Badge variant="danger">X</Badge>)
    expect(screen.getByText('X')).toHaveClass('bg-rose-50')
  })

  it('aceita className extra', () => {
    render(<Badge className="mt-2">X</Badge>)
    expect(screen.getByText('X')).toHaveClass('mt-2')
  })

  variants.forEach((v) => {
    it(`renderiza sem erro com variant="${v}"`, () => {
      render(<Badge variant={v}>{v}</Badge>)
      expect(screen.getByText(v)).toBeInTheDocument()
    })
  })
})
