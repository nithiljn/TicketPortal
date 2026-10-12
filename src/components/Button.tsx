import React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'ticket'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  shortcut?: string
  theme?: 'dark' | 'light'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      shortcut,
      theme,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
      md: 'h-8.5 px-3.5 text-xs gap-2 rounded-lg',
      lg: 'h-10 px-4 text-sm gap-2 rounded-lg',
    }

    // Color and border styles
    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:border-zinc-100 shadow-xs',
      secondary:
        'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border-zinc-200/80 dark:bg-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.12] dark:border-white/[0.1] shadow-xs',
      outline:
        'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-300 dark:bg-[#121215] dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:border-white/[0.1] shadow-xs',
      ticket:
        'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:border-white shadow-xs font-semibold',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border-rose-600 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500 dark:border-rose-600 shadow-xs font-semibold',
      ghost:
        'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border-transparent dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.06]',
    }

    // Resolve styles based on explicit theme when passed
    const getVariantClasses = (v: ButtonVariant): string => {
      if (theme === 'light') {
        switch (v) {
          case 'primary':
            return 'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900 shadow-xs'
          case 'secondary':
            return 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 border-zinc-200/80 shadow-xs'
          case 'outline':
            return 'bg-white text-zinc-700 hover:bg-zinc-50 border-zinc-300 shadow-xs'
          case 'ticket':
            return 'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-800 shadow-xs font-semibold'
          case 'danger':
            return 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border-rose-600 shadow-xs font-semibold'
          case 'ghost':
            return 'bg-transparent text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border-transparent'
        }
      }
      if (theme === 'dark') {
        switch (v) {
          case 'primary':
            return 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-zinc-100 shadow-xs'
          case 'secondary':
            return 'bg-white/[0.08] text-zinc-200 hover:bg-white/[0.12] border-white/[0.1] shadow-xs'
          case 'outline':
            return 'bg-[#121215] text-zinc-300 hover:bg-white/[0.04] border-white/[0.1] shadow-xs'
          case 'ticket':
            return 'bg-white text-zinc-900 hover:bg-zinc-100 border-white shadow-xs font-semibold'
          case 'danger':
            return 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 border-rose-600 shadow-xs font-semibold'
          case 'ghost':
            return 'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border-transparent'
        }
      }
      return variantClasses[v]
    }

    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium font-sans border
          transition-all duration-150 select-none cursor-pointer
          active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 focus-visible:ring-offset-2
          ${sizeClasses[size]}
          ${getVariantClasses(variant)}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <svg
            className="w-3.5 h-3.5 animate-spin text-current shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}

        <span className="truncate">{children}</span>

        {!isLoading && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}

        {shortcut && (
          <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-black/10 dark:bg-white/10 opacity-70 border border-black/10 dark:border-white/10 shrink-0">
            {shortcut}
          </kbd>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
