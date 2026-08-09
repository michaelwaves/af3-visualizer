import { Caption } from '@engine/scene/Caption'
import { palette } from '@engine/theme'
import { PairMap } from '../components/PairMap'
import { useActivations, useModel } from '../data'

/** Algorithm 3, drawn as the banded matrix it is. */
export const RelPosScene = () => {
  const activations = useActivations()
  const model = useModel()
  const matrix = activations?.pairMaps.relative_position_encoding
  if (!matrix || !model) return null

  const size = 7.2

  return (
    <group position={[-0.8, -0.5, 0]}>
      <PairMap
        id="relpos"
        matrix={matrix}
        label="relative_position_encoding"
        shape="[b, n, n, dp]"
        size={size}
        smooth
      />
      <Caption
        text="r_max = 32 · s_max = 2"
        position={[0, -size / 2 - 0.5, 0]}
        color={palette.muted}
        size={0.26}
      />
      <Caption
        text="← ligand + ion · 33 tokens"
        position={[size / 2 + 2.5, size / 2 - 0.6, 0]}
        color={palette.atom}
        size={0.26}
      />
    </group>
  )
}
