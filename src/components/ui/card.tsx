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
    default: 'bg-bg-secondary border-bg-tertiary',
    glass: 'bg-bg-secondary/50 backdrop-blur-md border-bg-tertiary/50',
    neon: 'bg-bg-secondary border-neon-purple/30 shadow-neon-purple/10',
    gradient: 'bg-gradient-to-br from-bg-secondary to-bg-tertiary border-neon-purple/20',
  }

  const hoverStyles = hover
    ? 'transition-all duration-300 hover:border-neon-purple/50 hover:shadow-lg hover:shadow-neon-purple/10 hover:-translate-y-1'
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
