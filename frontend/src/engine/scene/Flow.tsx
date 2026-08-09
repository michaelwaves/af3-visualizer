import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3, type Mesh, type Vector3Tuple } from 'three'
import { palette } from '../theme'

export interface FlowProps {
  from: Vector3Tuple
  to: Vector3Tuple
  color?: string
  /** 0..1 — how much of the path has been drawn. Drive this from a beat. */
  progress?: number
  radius?: number
  /** Lifts the midpoint to bow the path, keeping long runs from crossing geometry. */
  arc?: number
  /** Sends a bright pulse travelling along the path. */
  pulse?: boolean
}

/** A tapered tube carrying data between two tensors — the scene's only "arrow". */
export const Flow = ({
  from,
  to,
  color = palette.muted,
  progress = 1,
  radius = 0.045,
  arc = 0.35,
  pulse = false,
}: FlowProps) => {
  const curve = useMemo(() => {
    const start = new Vector3(...from)
    const end = new Vector3(...to)
    const middle = start.clone().lerp(end, 0.5)
    middle.y += start.distanceTo(end) * arc
    return new CatmullRomCurve3([start, middle, end])
  }, [from, to, arc])

  const bead = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!bead.current || !pulse) return
    const t = (clock.elapsedTime * 0.4) % 1
    bead.current.position.copy(curve.getPointAt(Math.min(t, progress)))
    bead.current.visible = t <= progress
  })

  if (progress <= 0.01) return null

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 48, radius, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.28 * progress} />
      </mesh>
      {pulse && (
        <mesh ref={bead}>
          <sphereGeometry args={[radius * 2.6, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  )
}
