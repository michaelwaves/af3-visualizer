import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { Flow } from '@engine/scene/Flow'
import { palette } from '@engine/theme'
import { MsaStack } from '../components/MsaStack'
import { PairMap } from '../components/PairMap'
import { useActivations, useMsa } from '../data'

/** Algorithms 9 and 10: the two-way channel between alignment and pair matrix. */
export const MsaPairScene = () => {
  const msa = useMsa()
  const activations = useActivations()
  const back = useDrive('back')
  if (!msa || !activations) return null

  return (
    <group>
      <group position={[-5.4, 0, 0]}>
        <MsaStack msa={msa} width={5.6} height={5.2} showLabels={false} />
        <Caption
          text="MSA"
          shape="[s, n, dm]"
          position={[0, 3, 0]}
          color={palette.msa}
          size={0.28}
        />
      </group>

      <Flow
        from={[-2.4, 1.2, 0]}
        to={[2.4, 1.2, 0]}
        color={palette.msa}
        label="outer product mean"
        expression="mean over s of a_si × b_sj → 32×32 → 128"
      />

      <PairMap
        id="opm"
        matrix={activations.pairMaps.outer_product_mean}
        label="pairwise += outer_product_mean"
        shape="[b, n, n, dp]"
        position={[5.4, 0, 0]}
        size={5.6}
      />

      <group visible={back > 0.05}>
        <Flow
          from={[2.4, -1.6, 0]}
          to={[-2.4, -1.6, 0]}
          color={palette.pair}
          progress={back}
          label="pair-weighted averaging"
          expression="w_ij = softmax_j Linear(z_ij)"
          labelOffset={-0.8}
        />
      </group>
    </group>
  )
}
