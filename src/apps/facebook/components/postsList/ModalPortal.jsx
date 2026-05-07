import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function ModalPortal({ children, isOpen }) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
