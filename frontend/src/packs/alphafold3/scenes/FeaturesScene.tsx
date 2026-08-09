import { useHighlight } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { TensorSlab } from '@engine/scene/TensorSlab'
import { palette, ramps } from '@engine/theme'
import { useFeatures, type FeatureTensor } from '../data'

const ROLE_COLORS: Record<string, string> = {
  atom: palette.atom,
  single: palette.single,
  msa: palette.msa,
  pair: palette.pair,
}

const COLUMNS = 3
const COLUMN_PITCH = 6
const ROW_PITCH = 5.2

/** The real input tensors, standing in a grid you can read straight on. */
export const FeaturesScene = () => {
  const features = useFeatures()
  if (!features) return null

  return (
    <group position={[1.6, 2.9, 0]}>
      {features.tensors.map((tensor, index) => (
        <FeatureSlab
          key={tensor.name}
          tensor={tensor}
          position={[
            (index % COLUMNS) * COLUMN_PITCH - COLUMN_PITCH,
            -Math.floor(index / COLUMNS) * ROW_PITCH,
            0,
          ]}
        />
      ))}
    </group>
  )
}

const FeatureSlab = ({
  tensor,
  position,
}: {
  tensor: FeatureTensor
  position: [number, number, number]
}) => {
  const highlighted = useHighlight(tensor.name)
  const rows = tensor.values.length
  const columns = tensor.values[0]?.length ?? 1
  const aspect = Math.min(2.2, Math.max(0.4, columns / rows))
  const height = 3
  const width = Math.min(5, height * aspect)

  return (
    <group position={position}>
      <TensorSlab
        id={tensor.name}
        values={tensor.values.flat()}
        rows={rows}
        columns={columns}
        ramp={ramps[(tensor.role as keyof typeof ramps) in ramps ? (tensor.role as keyof typeof ramps) : 'pair']}
        size={[width, height]}
        opacity={highlighted ? 1 : 0.7}
      />
      <Caption
        id={tensor.name}
        text={tensor.name}
        shape={`${tensor.shape} → [${tensor.actualShape.join(', ')}]`}
        position={[0, height / 2 + 0.3, 0]}
        color={ROLE_COLORS[tensor.role] ?? palette.muted}
        size={0.26}
      />
    </group>
  )
}
