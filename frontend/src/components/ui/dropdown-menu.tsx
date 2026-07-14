import { type HTMLAttributes, forwardRef, useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode
  align?: 'start' | 'end'
}

const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ trigger, children, align = 'start', className, ...props }, ref) => {
    const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
      <div ref={menuRef} className="relative inline-block">
        <div onClick={() => setOpen(!open)}>{trigger}</div>
        {open && (
          <div
            ref={ref}
            className={cn(
              'absolute z-50 mt-1 min-w-[12rem] rounded-lg border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95',
              align === 'end' ? 'right-0' : 'left-0',
              className
            )}
            onClick={() => setOpen(false)}
            {...props}
          >
            {children}
          </div>
        )}
      </div>
    )
  }
)

DropdownMenu.displayName = 'DropdownMenu'

interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-100 hover:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('-mx-1 my-1 h-px bg-gray-200', className)} {...props} />
  )
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator }
export type { DropdownMenuProps, DropdownMenuItemProps }
