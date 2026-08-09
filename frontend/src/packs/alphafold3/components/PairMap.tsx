import type { Vector3Tuple } from 'three'
import { Caption } from '@engine/scene/Caption'
import { TensorSlab } from '@engine/scene/TensorSlab'
import type { Ramp } from '@engine/scene/texture'
import { palette, ramps } from '@engine/theme'

export interface PairMapProps {
  id: string
  matrix: number[][]
  label: string
  shape?: string
  position?: Vector3Tuple
  size?: number
  ramp?: Ramp
  color?: string
  range?: [number, number]
  visible?: boolean
  smooth?: boolean
  orientation?: 'facing' | 'flat'
}

/**
 * A square token-by-token matrix laid flat, captioned. Most of AlphaFold 3's
 * internals are one of these, which is why it earns its own component.
 */
export const PairMap = ({
  id,
  matrix,
  label,
  shape,
  position = [0, 0, 0],
  size = 7,
  ramp = ramps.pair,
  color = palette.pair,
  range,
  visible = true,
  smooth = false,
  orientation = 'facing',
}: PairMapProps) => {
  if (!visible || !matrix?.length) return null

  // A standing slab is captioned above it; a flat one is captioned behind it.
  const captionAt: [number, number, number] =
    orientation === 'facing' ? [0, size / 2 + 0.45, 0] : [0, 0.55, -size / 2 - 0.45]

  return (
    <group position={position}>
      <TensorSlab
        id={id}
        values={matrix.flat()}
        rows={matrix.length}
        columns={matrix[0].length}
        ramp={ramp}
        size={[size, size]}
        range={range}
        smooth={smooth}
        orientation={orientation}
      />
      <Caption id={id} text={label} shape={shape} position={captionAt} color={color} size={0.3} />
    </group>
  )
}
