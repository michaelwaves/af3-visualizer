import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useExplainer } from '../store'
import type { CameraShot } from '../types'

const GLIDE = 1.9

/**
 * Eases the camera toward the active beat's shot. Beats without a shot inherit
 * the most recent one, so a chapter can hold a framing across several beats.
 */
export const CameraDirector = ({ fallback }: { fallback: CameraShot }) => {
  const camera = useThree((state) => state.camera)
  const shot = useGoverningShot(fallback)

  const target = useRef(new Vector3(...fallback.target))
  const desiredPosition = useRef(new Vector3(...fallback.position))
  const desiredTarget = useRef(new Vector3(...fallback.target))

  desiredPosition.current.set(...shot.position)
  desiredTarget.current.set(...shot.target)

  useFrame((_, delta) => {
    const rate = 1 - Math.exp(-delta * (GLIDE / (shot.duration ?? 1)))
    camera.position.lerp(desiredPosition.current, rate)
    target.current.lerp(desiredTarget.current, rate)
    camera.lookAt(target.current)
  })

  return null
}

/**
 * The shot in force at the current beat: the nearest camera at or before it in
 * this chapter. Derived rather than remembered, so jumping straight to a beat
 * from the table of contents frames it the same way playing into it does.
 */
const useGoverningShot = (fallback: CameraShot): CameraShot => {
  const pack = useExplainer((s) => s.pack)
  const chapterIndex = useExplainer((s) => s.chapterIndex)
  const beatIndex = useExplainer((s) => s.beatIndex)
  if (!pack) return fallback

  const beats = pack.chapters[chapterIndex].beats
  for (let index = Math.min(beatIndex, beats.length - 1); index >= 0; index--) {
    const shot = beats[index].camera
    if (shot) return shot
  }
  return fallback
}
