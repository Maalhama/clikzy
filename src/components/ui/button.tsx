import { forwardRef, type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'neon' | 'neon-pink'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  glow?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-neon-purple hover:bg-neon-purple/90 text-white hover:shadow-neon-purple hover:scale-[1.02] active:scale-[0.98]',
  secondary:
    'bg-neon-blue hover:bg-neon-blue/90 text-white hover:shadow-neon-blue hover:scale-[1.02] active:scale-[0.98]',
  outline:
    'border-2 border-neon-purple text-neon-purple hover:bg-neon-purple/10 hover:shadow-neon-purple/50',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
  danger:
    'bg-danger hover:bg-danger/90 text-white hover:shadow-neon-danger hover:scale-[1.02] active:scale-[0.98]',
  neon:
    'bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-neon-purple hover:scale-[1.02] active:scale-[0.98]',
  'neon-pink':
    'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-neon-pink hover:scale-[1.02] active:scale-[0.98]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      glow = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2
          font-semibold rounded-lg
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-neon-purple focus:ring-offset-2 focus:ring-offset-bg-primary
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${glow ? 'shadow-neon-purple animate-glow' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
