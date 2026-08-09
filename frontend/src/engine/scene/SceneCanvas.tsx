import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CameraDirector } from './CameraDirector'
import { useBeatClock } from '../hooks'
import { useActiveChapter, useExplainer } from '../store'
import { palette } from '../theme'
import type { CameraShot } from '../types'

const HOME: CameraShot = { position: [14, 9, 18], target: [0, 0, 0] }

/** Hosts the active chapter's scene, the beat clock and the camera director. */
export const SceneCanvas = () => (
  <Canvas
    camera={{ position: HOME.position, fov: 38, near: 0.1, far: 400 }}
    dpr={[1, 2]}
    gl={{ antialias: true }}
  >
    <color attach="background" args={[palette.background]} />
    <fog attach="fog" args={[palette.background, 34, 96]} />
    <ambientLight intensity={0.85} />
    <directionalLight position={[8, 14, 6]} intensity={1.1} />
    <directionalLight position={[-10, 6, -8]} intensity={0.4} color={palette.pair} />

    <Clock />
    <Camera />
    <Suspense fallback={null}>
      <ActiveScene />
    </Suspense>
  </Canvas>
)

/**
 * Resolved inside the canvas on purpose. React Three Fiber renders children into
 * its own reconciler root, so a scene swapped from outside would never remount —
 * subscribing to the store in here is what makes chapter changes take effect.
 */
const ActiveScene = () => {
  const pack = useExplainer((s) => s.pack)
  const chapter = useActiveChapter()
  if (!pack || !chapter) return null
  const Scene = pack.scenes[chapter.scene]
  return Scene ? <Scene /> : null
}

const Camera = () => {
  const freeLook = useExplainer((s) => s.freeLook)
  return freeLook ? (
    <OrbitControls makeDefault enablePan target={[0, 0, 0]} />
  ) : (
    <CameraDirector fallback={HOME} />
  )
}

/** Lives inside the canvas so it can hook the render loop. */
const Clock = () => {
  useBeatClock()
  return null
}
