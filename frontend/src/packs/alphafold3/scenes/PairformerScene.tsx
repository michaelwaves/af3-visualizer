import { Instance, Instances } from '@react-three/drei'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { Flow } from '@engine/scene/Flow'
import { palette } from '@engine/theme'
import { PairMap } from '../components/PairMap'
import { useActivations, useModel } from '../data'

const BLOCK_HEIGHT = 0.19
const BLOCK_GAP = 0.07

/** 48 blocks, drawn as 48 blocks — the trunk's depth made physical. */
export const PairformerScene = () => {
  const model = useModel()
  const activations = useActivations()
  const showBias = useDrive('bias')
  const showRecycle = useDrive('recycle')
  if (!model) return null

  const depth = model.depths.pairformer
  const pitch = BLOCK_HEIGHT + BLOCK_GAP
  const top = depth * pitch

  return (
    <group position={[0, -top / 2, 0]}>
      <Instances limit={depth} range={depth}>
        <boxGeometry args={[4.2, BLOCK_HEIGHT, 4.2]} />
        <meshStandardMaterial roughness={0.45} metalness={0.05} />
        {Array.from({ length: depth }, (_, index) => (
          <Instance
            key={index}
            position={[0, index * pitch, 0]}
            color={index % 2 ? palette.pair : '#3aa79d'}
          />
        ))}
      </Instances>

      <Caption
        id="stack"
        text="Pairformer"
        shape={`${depth} blocks · ${model.modules.find((m) => m.name === 'pairformer')?.parameters.toLocaleString()} parameters`}
        position={[0, top + 0.7, 0]}
        color={palette.pair}
      />

      <PairMap
        id="bias"
        matrix={activations?.attentionHeads.attention_1 ?? []}
        label="pair → attention bias"
        shape="[b, h, n, n]"
        position={[6.6, top * 0.45, 0]}
        size={4.4}
        color={palette.single}
        visible={showBias > 0.05}
        smooth
      />
      <Flow
        from={[2.3, top * 0.45, 0]}
        to={[4.6, top * 0.45, 0]}
        color={palette.single}
        progress={showBias}
        arc={0.1}
        pulse
      />

      <group visible={showRecycle > 0.05}>
        <Flow
          from={[-2.4, top, 0]}
          to={[-2.4, 0, 0]}
          color={palette.template}
          progress={showRecycle}
          arc={-0.45}
          pulse
        />
        <Caption
          id="recycle"
          text="recycling"
          shape="single + pairwise, detached"
          position={[-4.6, top * 0.5, 0]}
          color={palette.template}
          size={0.27}
        />
      </group>
    </group>
  )
}
