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
    'bg-gradient-to-br from-neon-purple via-[#7B3FDF] to-[#B14CE8] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-10px_rgba(155,92,255,0.6)] [@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_14px_36px_-12px_rgba(155,92,255,0.75)] active:translate-y-0 active:scale-[0.98]',
  secondary:
    'bg-gradient-to-br from-neon-blue to-[#1E9FD4] text-bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_24px_-10px_rgba(60,203,255,0.6)] [@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  outline:
    'border border-neon-purple/60 text-neon-purple bg-neon-purple/[0.06] [@media(hover:hover)]:hover:bg-neon-purple/15 [@media(hover:hover)]:hover:border-neon-purple [@media(hover:hover)]:hover:shadow-[0_0_24px_rgba(155,92,255,0.25)]',
  ghost:
    'text-text-secondary [@media(hover:hover)]:hover:text-text-primary [@media(hover:hover)]:hover:bg-white/[0.06]',
  danger:
    'bg-gradient-to-br from-danger to-[#D63447] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-10px_rgba(255,71,87,0.6)] [@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  neon:
    'bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-10px_rgba(155,92,255,0.6)] [@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
  'neon-pink':
    'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_24px_-10px_rgba(255,79,216,0.5)] [@media(hover:hover)]:hover:brightness-110 [@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
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
          focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary
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
