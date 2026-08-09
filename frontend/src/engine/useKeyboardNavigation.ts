import { useEffect } from 'react'
import { useExplainer } from './store'

/** Arrow keys and space move through beats; Escape stops autoplay. */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const { next, previous, toggleAutoplay, autoplay } = useExplainer.getState()
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next()
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') previous()
      else if (event.key === ' ') {
        event.preventDefault()
        toggleAutoplay()
      } else if (event.key === 'Escape' && autoplay) toggleAutoplay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
