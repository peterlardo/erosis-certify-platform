import { type HTMLAttributes, forwardRef, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  title?: string
}

const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onClose, title, children, className, ...props }, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
      const el = dialogRef.current
      if (!el) return
      if (open && !el.open) {
        el.showModal()
      } else if (!open && el.open) {
        el.close()
      }
    }, [open])

    useEffect(() => {
      const el = dialogRef.current
      if (!el) return
      const handleClose = () => {
        onClose()
      }
      el.addEventListener('close', handleClose)
      return () => el.removeEventListener('close', handleClose)
    }, [onClose])

    if (!open) return null

    return (
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-auto bg-transparent p-0 backdrop:bg-black/50"
      >
        <div
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200',
            className
          )}
          {...props}
        >
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="px-6 py-4">{children}</div>
        </div>
      </dialog>
    )
  }
)

Dialog.displayName = 'Dialog'

export { Dialog }
export type { DialogProps }
