import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-primary/10 text-primary border-transparent',
  secondary: 'bg-secondary/10 text-secondary border-transparent',
  success: 'bg-green-100 text-green-700 border-transparent',
  warning: 'bg-yellow-100 text-yellow-700 border-transparent',
  danger: 'bg-red-100 text-red-700 border-transparent',
  outline: 'text-gray-700 border-gray-300',
} as const

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge, variants }
export type { BadgeProps }
