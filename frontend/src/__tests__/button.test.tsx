import { render, screen } from '@testing-library/react'

import { Button, buttonVariants } from '../components/ui/button'

describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('data-slot', 'button')
    expect(button).toHaveAttribute('data-variant', 'default')
    expect(button).toHaveAttribute('data-size', 'default')
  })

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveAttribute('data-variant', 'destructive')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'outline')
  })

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary')
  })

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'ghost')
  })

  it('renders with link variant', () => {
    render(<Button variant="link">Link</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'link')
  })

  it('renders with sm size', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')
  })

  it('renders with lg size', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg')
  })

  it('renders with icon size', () => {
    render(<Button size="icon">I</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'icon')
  })

  it('renders with xs size', () => {
    render(<Button size="xs">Tiny</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'xs')
  })

  it('renders with icon-xs size', () => {
    render(<Button size="icon-xs">X</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'icon-xs')
  })

  it('renders with icon-sm size', () => {
    render(<Button size="icon-sm">S</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'icon-sm')
  })

  it('renders with icon-lg size', () => {
    render(<Button size="icon-lg">L</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'icon-lg')
  })

  it('renders as child component with asChild', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('applies additional className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('custom-class')
  })

  it('passes through HTML button props', () => {
    render(
      <Button disabled type="submit">
        Submit
      </Button>
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('buttonVariants generates correct classes', () => {
    const classes = buttonVariants({ variant: 'destructive', size: 'lg' })
    expect(classes).toContain('bg-destructive')
    expect(classes).toContain('h-10')
  })
})
