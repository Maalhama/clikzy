import { useEffect, type RefObject } from 'react'

/**
 * Accessibilité des modales : focus initial dans la modale, piège de focus (Tab/Shift+Tab
 * bouclent à l'intérieur), fermeture à Échap, et restauration du focus sur l'élément
 * déclencheur à la fermeture. À appeler avec un ref sur le PANNEAU de la modale.
 */
export function useModalA11y(
  isOpen: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const getFocusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )
    // Focus initial (après le montage / l'animation d'entrée).
    const t = setTimeout(() => getFocusables()[0]?.focus(), 50)

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const f = getFocusables()
      if (f.length === 0) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [isOpen, onClose, panelRef])
}
