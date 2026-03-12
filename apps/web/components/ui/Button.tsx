import { forwardRef, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  asChild?: boolean
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-sky-accent text-white hover:bg-sky-light focus-visible:ring-sky-accent disabled:bg-sky-accent/50',
  secondary:
    'bg-navy text-white hover:bg-navy-700 focus-visible:ring-navy disabled:bg-navy/50',
  ghost:
    'bg-transparent text-navy border border-navy/20 hover:bg-navy/5 focus-visible:ring-navy disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-600/50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, asChild, className, children, disabled, ...props },
    ref
  ) => {
    const classes = cn(
      'inline-flex items-center justify-center rounded-xl font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      className
    )

    // When asChild, clone the single child and merge button styles onto it
    if (asChild && isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>
      return cloneElement(child, {
        ...child.props,
        className: cn(classes, child.props.className),
      })
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classes}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
