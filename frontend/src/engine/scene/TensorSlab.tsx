import { useMemo } from 'react'
import type { Vector3Tuple } from 'three'
import { DoubleSide } from 'three'
import { Edges } from '@react-three/drei'
import { matrixTexture, type Ramp } from './texture'
import { useHighlight } from '../hooks'
import { palette } from '../theme'

export interface TensorSlabProps {
  id: string
  /** Row-major values painted onto the slab's top face. */
  values: ArrayLike<number>
  rows: number
  columns: number
  ramp: Ramp
  /** World-space footprint; thickness stays thin to read as a sheet of numbers. */
  size: [number, number]
  thickness?: number
  position?: Vector3Tuple
  rotation?: Vector3Tuple
  range?: [number, number]
  smooth?: boolean
  opacity?: number
  /**
   * `facing` stands the slab up so its values read straight on; `flat` lays it
   * down in the ground plane. Explicit `rotation` overrides both.
   */
  orientation?: 'facing' | 'flat'
}

/** The painted face is +Y, so a quarter turn about X brings it to face +Z. */
const FACING_ROTATION: Vector3Tuple = [Math.PI / 2, 0, 0]

/**
 * The workhorse primitive: a thin slab whose face shows real tensor values.
 * Every matrix in every chapter is one of these, so shapes stay comparable.
 */
export const TensorSlab = ({
  id,
  values,
  rows,
  columns,
  ramp,
  size,
  thickness = 0.06,
  position = [0, 0, 0],
  rotation,
  range,
  smooth = false,
  opacity = 1,
  orientation = 'facing',
}: TensorSlabProps) => {
  const texture = useMemo(
    () => matrixTexture(values, columns, rows, ramp, range, smooth),
    [values, columns, rows, ramp, range, smooth],
  )
  const highlighted = useHighlight(id)
  const resolved = rotation ?? (orientation === 'facing' ? FACING_ROTATION : [0, 0, 0])

  return (
    <group position={position} rotation={resolved}>
      <mesh>
        <boxGeometry args={[size[0], thickness, size[1]]} />
        <meshBasicMaterial
          attach="material-2"
          map={texture}
          transparent={opacity < 1}
          opacity={opacity}
        />
        <meshStandardMaterial
          attach="material-0"
          color={palette.surface}
          transparent={opacity < 1}
          opacity={opacity}
        />
        <meshStandardMaterial attach="material-1" color={palette.surface} />
        <meshStandardMaterial attach="material-3" color="#05060a" side={DoubleSide} />
        <meshStandardMaterial attach="material-4" color={palette.surface} />
        <meshStandardMaterial attach="material-5" color={palette.surface} />
        <Edges threshold={15} color={highlighted ? palette.text : palette.line} />
      </mesh>
    </group>
  )
}
