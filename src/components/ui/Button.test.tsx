import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza children', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('chama onClick ao clicar', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('nao chama onClick quando disabled', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>Click</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('aplica variante primary por default', () => {
    render(<Button>X</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-emerald-600')
  })

  it('aplica variante danger', () => {
    render(<Button variant="danger">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-rose-600')
  })

  it('aplica variante secondary', () => {
    render(<Button variant="secondary">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-white')
  })

  it('renderiza icone quando passado', () => {
    const Icon = () => <svg data-testid="icon" />
    render(<Button icon={Icon}>X</Button>)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('type="submit" configura atributo corretamente', () => {
    render(<Button type="submit">X</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
