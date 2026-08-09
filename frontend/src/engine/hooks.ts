import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useActiveBeat, useExplainer } from './store'

const BEAT_SECONDS = 3.2

/** Advances beat progress every frame, and auto-advances beats when autoplay is on. */
export const useBeatClock = () => {
  const beat = useActiveBeat()
  const elapsed = useRef(0)

  useEffect(() => {
    elapsed.current = 0
  }, [beat?.id])

  useFrame((_, delta) => {
    const { autoplay, setBeatProgress, next, beatProgress } = useExplainer.getState()
    elapsed.current += delta
    const progress = Math.min(1, elapsed.current / BEAT_SECONDS)
    if (progress !== beatProgress) setBeatProgress(progress)
    if (autoplay && progress >= 1 && elapsed.current > BEAT_SECONDS + 1.4) {
      elapsed.current = 0
      next()
    }
  })
}

/**
 * A 0..1 scalar for a named animation channel. Returns 1 once the beat that owns
 * the channel has played, 0 before it, and the eased value while it plays — so a
 * scene can express "this has happened yet?" and "how far along?" with one number.
 */
export const useDrive = (channel: string): number => {
  const pack = useExplainer((s) => s.pack)
  const chapterIndex = useExplainer((s) => s.chapterIndex)
  const beatIndex = useExplainer((s) => s.beatIndex)
  const progress = useExplainer((s) => s.beatProgress)
  if (!pack) return 0

  const beats = pack.chapters[chapterIndex].beats
  const owner = beats.findIndex((beat) => beat.drive?.includes(channel))
  if (owner < 0) return 0
  if (beatIndex > owner) return 1
  if (beatIndex < owner) return 0
  return easeInOutCubic(progress)
}

/** True while the active beat spotlights the given scene element. */
export const useHighlight = (id: string): boolean => {
  const beat = useActiveBeat()
  return Boolean(beat?.highlight?.includes(id))
}

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
