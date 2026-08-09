import { useEffect } from 'react'
import { useWalkthrough } from '@/store/useWalkthrough'

/** Arrow keys and j/k step through the pass, unless a field has focus. */
export function useKeyboardNavigation(): void {
  const advance = useWalkthrough((state) => state.advance)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      if (['ArrowRight', 'ArrowDown', 'j', ' '].includes(event.key)) {
        event.preventDefault()
        advance(1)
      } else if (['ArrowLeft', 'ArrowUp', 'k'].includes(event.key)) {
        event.preventDefault()
        advance(-1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [advance])
}
