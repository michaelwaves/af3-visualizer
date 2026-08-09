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

/** The real input tensors, laid out as a shelf you can walk along. */
export const FeaturesScene = () => {
  const features = useFeatures()
  if (!features) return null

  return (
    <group>
      {features.tensors.map((tensor, index) => (
        <FeatureSlab
          key={tensor.name}
          tensor={tensor}
          position={[(index % 3) * 6.2 - 6.2, 0, Math.floor(index / 3) * 6.6 - 3.3]}
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
  const aspect = Math.min(2.4, Math.max(0.5, columns / rows))

  return (
    <group position={position}>
      <TensorSlab
        id={tensor.name}
        values={tensor.values.flat()}
        rows={rows}
        columns={columns}
        ramp={ramps[(tensor.role as keyof typeof ramps) in ramps ? (tensor.role as keyof typeof ramps) : 'pair']}
        size={[Math.min(5, 2.6 * aspect), 3.4]}
        opacity={highlighted ? 1 : 0.78}
      />
      <Caption
        id={tensor.name}
        text={tensor.name}
        shape={`${tensor.shape} → [${tensor.actualShape.join(', ')}]`}
        position={[0, 0.5, -2.3]}
        color={ROLE_COLORS[tensor.role] ?? palette.muted}
        size={0.28}
      />
    </group>
  )
}
