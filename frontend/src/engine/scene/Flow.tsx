import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { Quaternion, Vector3, type Vector3Tuple } from 'three'
import { Caption } from './Caption'
import { palette } from '../theme'

export interface FlowProps {
  from: Vector3Tuple
  to: Vector3Tuple
  color?: string
  /** 0..1 — how much of the arrow has been drawn. Drive this from a beat. */
  progress?: number
  /** What the arrow does, e.g. "mean-pool over each token's atoms". */
  label?: string
  /** The operation itself, set in monospace beneath the label. */
  expression?: string
  /** Nudges the label off the shaft when two arrows run close together. */
  labelOffset?: number
  width?: number
}

const HEAD_LENGTH = 0.34
const HEAD_RADIUS = 0.11
const UP = new Vector3(0, 1, 0)

/**
 * A straight arrow between two tensors, optionally captioned with the operation
 * it performs. Deliberately thin and unlit: the tensors are the subject, and an
 * arrow that glows competes with them.
 */
export const Flow = ({
  from,
  to,
  color = palette.muted,
  progress = 1,
  label,
  expression,
  labelOffset = 0.55,
  width = 1.4,
}: FlowProps) => {
  const geometry = useMemo(() => {
    const start = new Vector3(...from)
    const end = new Vector3(...to)
    const direction = end.clone().sub(start)
    const length = direction.length()
    const unit = direction.clone().normalize()
    return {
      start,
      unit,
      length,
      orientation: new Quaternion().setFromUnitVectors(UP, unit),
      midpoint: start.clone().addScaledVector(unit, length / 2),
    }
  }, [from, to])

  if (progress <= 0.02) return null

  const drawn = geometry.length * progress
  const shaftEnd = geometry.start.clone().addScaledVector(geometry.unit, Math.max(0, drawn - HEAD_LENGTH))
  const headAt = geometry.start.clone().addScaledVector(geometry.unit, drawn - HEAD_LENGTH / 2)

  return (
    <group>
      <Line
        points={[geometry.start.toArray(), shaftEnd.toArray()]}
        color={color}
        lineWidth={width}
        transparent
        opacity={0.75}
      />
      {drawn > HEAD_LENGTH && (
        <mesh position={headAt} quaternion={geometry.orientation}>
          <coneGeometry args={[HEAD_RADIUS, HEAD_LENGTH, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}

      {label && progress > 0.6 && (
        <Caption
          text={label}
          shape={expression}
          position={[geometry.midpoint.x, geometry.midpoint.y + labelOffset, geometry.midpoint.z]}
          color={color}
          size={0.23}
        />
      )}
    </group>
  )
}
