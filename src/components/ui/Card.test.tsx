import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renderiza children', () => {
    render(<Card>Conteudo</Card>)
    expect(screen.getByText('Conteudo')).toBeInTheDocument()
  })

  it('aplica className extra', () => {
    render(<Card className="p-8">X</Card>)
    // getByText('X') retorna o próprio <div> do Card
    expect(screen.getByText('X')).toHaveClass('p-8')
  })

  it('tem classes base de card', () => {
    render(<Card>X</Card>)
    expect(screen.getByText('X')).toHaveClass('rounded-xl')
  })
})
