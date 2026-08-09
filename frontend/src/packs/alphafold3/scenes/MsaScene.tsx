import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { TensorSlab } from '@engine/scene/TensorSlab'
import { ramps, palette } from '@engine/theme'
import { MsaStack } from '../components/MsaStack'
import { useMsa } from '../data'

const WIDTH = 9
const HEIGHT = 8.2

/** Where evolution enters the model: 15,953 relatives of the target sequence. */
export const MsaScene = () => {
  const msa = useMsa()
  const rowsIn = useDrive('rows')
  const showConservation = useDrive('conservation')
  const showGaps = useDrive('gaps')
  if (!msa) return null

  return (
    <group position={[2.2, 0.4, 0]}>
      <MsaStack msa={msa} width={WIDTH} height={HEIGHT} reveal={Math.max(0.02, rowsIn)} />
      <Caption
        id="msa"
        text="multiple sequence alignment"
        shape={`${msa.rows.length} rows shown of ${msa.depth.toLocaleString()} · ${msa.length} columns`}
        position={[0, HEIGHT / 2 + 0.6, 0]}
        color={palette.msa}
        size={0.32}
      />

      <group visible={showConservation > 0.05} position={[0, -HEIGHT / 2 - 0.55, 0]}>
        <TensorSlab
          id="conservation"
          values={msa.conservation}
          rows={1}
          columns={msa.conservation.length}
          ramp={ramps.msa}
          size={[WIDTH, 0.55]}
          rotation={[Math.PI / 2, 0, 0]}
          range={[0, 1]}
          smooth
        />
        <Caption
          text="column conservation"
          position={[0, -0.55, 0]}
          color={palette.msa}
          size={0.26}
        />
      </group>

      <group visible={showGaps > 0.05} position={[0, -HEIGHT / 2 - 1.5, 0]}>
        <TensorSlab
          id="gaps"
          values={msa.gapFraction}
          rows={1}
          columns={msa.gapFraction.length}
          ramp={ramps.noise}
          size={[WIDTH, 0.4]}
          rotation={[Math.PI / 2, 0, 0]}
          range={[0, 1]}
          smooth
        />
        <Caption text="gap fraction" position={[0, -0.5, 0]} color={palette.noise} size={0.25} />
      </group>
    </group>
  )
}
