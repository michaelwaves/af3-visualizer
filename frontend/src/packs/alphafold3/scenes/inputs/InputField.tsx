import { Text } from '@react-three/drei'
import { useHighlight } from '@engine/hooks'
import { palette } from '@engine/theme'

interface InputFieldProps {
  /** Matches a beat's highlight id, so the prose and the field stay in sync. */
  id: string
  label: string
  y: number
  lines: string[]
  badge: string
  color: string
  /** 0..1 reveal, for fields that arrive on a later beat. */
  opacity?: number
}

/** Labels end here, values start here — a two-column form, not a paragraph. */
const LABEL_RIGHT = -1.5
const VALUE_LEFT = -1.3
export const LINE_HEIGHT = 0.265

/** One argument of the input dataclass: its name, its literal value, its size. */
export const InputField = ({
  id,
  label,
  y,
  lines,
  badge,
  color,
  opacity = 1,
}: InputFieldProps) => {
  const highlighted = useHighlight(id)
  if (opacity < 0.01) return null

  return (
    <group position={[0, y, 0]}>
      <Text
        position={[LABEL_RIGHT, 0, 0]}
        anchorX="right"
        anchorY="top"
        fontSize={0.185}
        color={palette.muted}
        fillOpacity={opacity}
      >
        {label}
      </Text>

      {lines.map((line, index) => (
        <Text
          key={index}
          position={[VALUE_LEFT, -index * LINE_HEIGHT, 0]}
          anchorX="left"
          anchorY="top"
          fontSize={0.2}
          color={color}
          fillOpacity={opacity * (highlighted ? 1 : 0.8)}
          letterSpacing={0.08}
        >
          {line}
        </Text>
      ))}

      <Text
        position={[VALUE_LEFT, -lines.length * LINE_HEIGHT - 0.04, 0]}
        anchorX="left"
        anchorY="top"
        fontSize={0.15}
        color={palette.muted}
        fillOpacity={opacity * 0.85}
      >
        {badge}
      </Text>
    </group>
  )
}
