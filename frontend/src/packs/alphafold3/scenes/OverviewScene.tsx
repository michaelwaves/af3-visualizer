import { useMemo } from 'react'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { Flow } from '@engine/scene/Flow'
import { palette } from '@engine/theme'
import { useModel } from '../data'

const MODULE_COLORS: Record<string, string> = {
  input_embedder: palette.atom,
  relative_position_encoding: palette.muted,
  template_embedder: palette.template,
  msa_module: palette.msa,
  pairformer: palette.pair,
  diffusion_module: palette.noise,
  confidence_head: palette.confidence,
  distogram_head: palette.structure,
  recycle_single: palette.muted,
  recycle_pairwise: palette.muted,
}

const MAX_WIDTH = 9

/** Every module, sized by its measured parameter count — the model to scale. */
export const OverviewScene = () => {
  const model = useModel()
  const assemble = useDrive('assemble')
  const showSizes = useDrive('sizes')
  const showMeasured = useDrive('measured')

  const blocks = useMemo(() => {
    if (!model) return []
    const largest = model.modules[0].parameters
    return model.modules
      .filter((module) => module.parameters > 5000)
      .map((module, index) => ({
        ...module,
        width: Math.max(0.6, (module.parameters / largest) * MAX_WIDTH),
        color: MODULE_COLORS[module.name] ?? palette.muted,
        y: -index * 1.15,
        share: module.parameters / model.totalParameters,
      }))
  }, [model])

  if (!model) return null

  return (
    <group position={[0, blocks.length * 0.55, 0]}>
      {blocks.map((block, index) => (
        <group
          key={block.name}
          position={[0, block.y, 0]}
          visible={assemble > index / (blocks.length + 2)}
        >
          <mesh>
            <boxGeometry args={[block.width, 0.72, 2.6]} />
            <meshStandardMaterial color={block.color} roughness={0.45} />
          </mesh>
          <Caption
            text={block.name}
            shape={
              showSizes > 0.05
                ? `${block.parameters.toLocaleString()} · ${(block.share * 100).toFixed(1)}%`
                : undefined
            }
            position={[block.width / 2 + 2.6, 0, 0]}
            color={block.color}
            size={0.28}
          />
        </group>
      ))}

      <Flow
        from={[0, 0.6, 0]}
        to={[0, blocks[blocks.length - 1].y - 0.6, 0]}
        color={palette.line}
        progress={assemble}
        width={1}
      />

      <Caption
        id="sizes"
        text={`${model.totalParameters.toLocaleString()} parameters`}
        shape={`${model.input.tokens} tokens · ${model.input.atoms} atoms`}
        position={[0, 1.9, 0]}
        size={0.4}
      />

      <Caption
        id="measured"
        text={`${model.measured.forwardSeconds} s · ${model.measured.peakMemoryGb} GB`}
        shape={model.measured.device}
        position={[0, blocks[blocks.length - 1].y - 1.8, 0]}
        color={palette.confidence}
        size={0.3}
        visible={showMeasured > 0.05}
      />
    </group>
  )
}
