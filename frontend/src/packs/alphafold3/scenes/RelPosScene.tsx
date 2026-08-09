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

  return (
    <group>
      <PairMap
        id="relpos"
        matrix={matrix}
        label="relative_position_encoding"
        shape="[b, n, n, dp]"
        size={9}
        smooth
      />
      <Caption
        text="r_max = 32 · s_max = 2"
        position={[0, 0.4, 5.4]}
        color={palette.muted}
        size={0.26}
      />
      <Caption
        text="ligand + ion · 33 tokens"
        position={[3.4, 0.6, -4.4]}
        color={palette.atom}
        size={0.25}
      />
    </group>
  )
}
