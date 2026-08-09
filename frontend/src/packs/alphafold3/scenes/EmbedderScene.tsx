import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { Flow } from '@engine/scene/Flow'
import { TensorSlab } from '@engine/scene/TensorSlab'
import { palette, ramps } from '@engine/theme'
import { PairMap } from '../components/PairMap'
import { useActivations, useFeatures, useModel } from '../data'

/** Algorithm 2: atoms enter, a single and a pair representation leave. */
export const EmbedderScene = () => {
  const model = useModel()
  const features = useFeatures()
  const activations = useActivations()
  const pooled = useDrive('pool')
  const single = useDrive('single')
  const pair = useDrive('pair')
  if (!model || !features) return null

  const atomInputs = features.tensors.find((tensor) => tensor.name === 'atom_inputs')
  const pairInit = activations?.pairMaps.relative_position_encoding

  return (
    <group>
      {atomInputs && (
        <group position={[-6.5, 0, 0]}>
          <TensorSlab
            id="atomTransformer"
            values={atomInputs.values.flat()}
            rows={atomInputs.values.length}
            columns={atomInputs.values[0].length}
            ramp={ramps.atom}
            size={[1.4, 4.2]}
          />
          <Caption
            id="atomTransformer"
            text="atom transformer"
            shape="3 blocks · 4 heads · window 27"
            position={[0, 0.6, -2.6]}
            color={palette.atom}
            size={0.28}
          />
        </group>
      )}

      <Flow from={[-5.6, 0.2, 0]} to={[-2.2, 0.2, 0]} color={palette.atom} progress={pooled} pulse />

      <SingleSlab
        id="pooled"
        matrix={activations?.singleMaps.single_inputs}
        label="pooled tokens"
        shape="[n, dim]"
        position={[-1, 0, 0]}
        size={[2, 3.6]}
        visible={pooled > 0.05}
      />

      <SingleSlab
        id="single"
        matrix={activations?.singleMaps.trunk_single}
        label="single"
        shape="[b, n, ds]"
        position={[3.4, 0, -2.6]}
        size={[2.6, 3.4]}
        visible={single > 0.05}
      />

      {pairInit && (
        <PairMap
          id="pair"
          matrix={pairInit}
          label="pairwise"
          shape="[b, n, n, dp]"
          position={[5, 0, 3.6]}
          size={4.6}
          visible={pair > 0.05}
        />
      )}

      <Flow from={[-0.2, 0.2, 0]} to={[3.4, 0.2, -2.6]} color={palette.single} progress={single} />
      <Flow from={[-0.2, 0.2, 0]} to={[5, 0.2, 3.6]} color={palette.pair} progress={pair} />
    </group>
  )
}

/** A token × channel slab of measured activations. */
const SingleSlab = ({
  id,
  matrix,
  label,
  shape,
  position,
  size,
  visible,
}: {
  id: string
  matrix: number[][] | undefined
  label: string
  shape: string
  position: [number, number, number]
  size: [number, number]
  visible: boolean
}) => {
  if (!matrix || !visible) return null
  return (
    <group position={position}>
      <TensorSlab
        id={id}
        values={matrix.flat()}
        rows={matrix.length}
        columns={matrix[0].length}
        ramp={ramps.single}
        size={size}
      />
      <Caption
        id={id}
        text={label}
        shape={shape}
        position={[0, 0.6, -size[1] / 2 - 0.4]}
        color={palette.single}
        size={0.27}
      />
    </group>
  )
}
