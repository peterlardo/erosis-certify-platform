import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm',
  secondary: 'bg-secondary text-white hover:bg-secondary/90 shadow-sm',
  ghost: 'text-gray-700 hover:bg-gray-100',
  link: 'text-primary underline-offset-4 hover:underline',
} as const

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3 text-sm',
  lg: 'h-11 rounded-lg px-8 text-base',
  icon: 'h-10 w-10',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button, variants, sizes }
export type { ButtonProps }
