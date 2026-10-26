import { X } from "lucide-react"
import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Heading } from "./Heading"
import { cx } from "./cx"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  fullScreenOnMobile?: boolean
}

/** Centred dialog on desktop, optionally a full-screen sheet below 768px. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  fullScreenOnMobile = false,
}: ModalProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    panel.current?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "relative flex w-full flex-col bg-surface shadow-pop focus:outline-none md:max-h-[90vh] md:max-w-md md:rounded-lg",
          fullScreenOnMobile ? "h-full" : "max-h-[90vh] rounded-t-lg",
          "md:h-auto",
        )}
      >
        {!fullScreenOnMobile && (
          <div
            className="mx-auto mt-2 h-1 w-10 rounded-lg bg-line md:hidden"
            aria-hidden
          />
        )}
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4 md:px-6 md:pt-6">
          <Heading level={2} id={titleId}>
            {title}
          </Heading>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-md p-2 text-ink-subtle hover:bg-hover hover:text-ink"
          >
            <X aria-hidden strokeWidth={1.5} className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 md:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 md:flex-row md:justify-end md:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
