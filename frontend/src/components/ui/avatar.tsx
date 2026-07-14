import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const getInitials = (name?: string) => {
      if (!name) return '?'
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-primary/10 text-primary font-medium',
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || ''} className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials(fallback)}</span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
export type { AvatarProps }
