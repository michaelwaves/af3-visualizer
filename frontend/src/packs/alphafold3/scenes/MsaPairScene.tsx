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
      <group position={[-5.5, 0, 0]}>
        <MsaStack msa={msa} width={6} height={5} showLabels={false} />
        <Caption
          text="MSA"
          shape="[s, n, dm]"
          position={[0, 0.6, -3.1]}
          color={palette.msa}
          size={0.28}
        />
      </group>

      <Flow from={[-2.4, 0.3, 0]} to={[2.2, 0.3, 0]} color={palette.msa} arc={0.28} pulse />
      <Caption
        id="opm"
        text="outer product mean"
        shape="32 × 32 → 128"
        position={[-0.1, 2.1, 0]}
        color={palette.msa}
        size={0.27}
      />

      <PairMap
        id="opm"
        matrix={activations.pairMaps.outer_product_mean}
        label="pairwise += outer_product_mean"
        shape="[b, n, n, dp]"
        position={[5.5, 0, 0]}
        size={6}
      />

      <group visible={back > 0.05}>
        <Flow
          from={[2.4, -0.4, 2.6]}
          to={[-2.2, -0.4, 2.6]}
          color={palette.pair}
          arc={-0.24}
          progress={back}
          pulse
        />
        <Caption
          id="pwa"
          text="MSA pair-weighted averaging"
          shape="pair → attention weights over columns"
          position={[0, -1.6, 2.6]}
          color={palette.pair}
          size={0.26}
        />
      </group>
    </group>
  )
}
