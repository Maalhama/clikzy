import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'neon' | 'gradient'
  hover?: boolean
  glow?: boolean
}

export function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'panel border-transparent',
    glass: 'panel border-transparent backdrop-blur-md',
    neon: 'bg-bg-secondary border-neon-purple/40 shadow-[0_0_30px_-10px_rgba(155,92,255,0.35)]',
    gradient: 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border-neon-purple/20',
  }

  const hoverStyles = hover
    ? 'panel-hover hover:border-neon-purple/50'
    : ''

  const glowStyles = glow ? 'shadow-neon-purple animate-glow' : ''

  return (
    <div
      className={`
        rounded-xl border
        ${variantStyles[variant]}
        ${hoverStyles}
        ${glowStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h2 className={`text-xl font-bold text-text-primary ${className}`}>
      {children}
    </h2>
  )
}

export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={`text-sm text-text-secondary mt-1 ${className}`}>
      {children}
    </p>
  )
}

export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`mt-6 ${className}`}>
      {children}
    </div>
  )
}
