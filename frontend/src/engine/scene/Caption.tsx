import { Billboard, Text } from '@react-three/drei'
import type { Vector3Tuple } from 'three'
import { palette } from '../theme'
import { useHighlight } from '../hooks'

export interface CaptionProps {
  /** Matches a beat's highlight id, so prose and scene labels stay in sync. */
  id?: string
  text: string
  /** Monospace shape annotation rendered under the title, e.g. "[n, n, 128]". */
  shape?: string
  position: Vector3Tuple
  color?: string
  size?: number
  visible?: boolean
}

/** A billboarded label that always faces the camera and never occludes geometry. */
export const Caption = ({
  id,
  text,
  shape,
  position,
  color = palette.text,
  size = 0.34,
  visible = true,
}: CaptionProps) => {
  const highlighted = useHighlight(id ?? '')
  if (!visible) return null

  return (
    <Billboard position={position}>
      <Text
        fontSize={size}
        color={highlighted ? palette.text : color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={size * 0.06}
        outlineColor={palette.background}
        fillOpacity={highlighted ? 1 : 0.86}
      >
        {text}
      </Text>
      {shape && (
        <Text
          position={[0, -size * 0.42, 0]}
          fontSize={size * 0.72}
          color={palette.muted}
          anchorX="center"
          anchorY="top"
          outlineWidth={size * 0.05}
          outlineColor={palette.background}
        >
          {shape}
        </Text>
      )}
    </Billboard>
  )
}
