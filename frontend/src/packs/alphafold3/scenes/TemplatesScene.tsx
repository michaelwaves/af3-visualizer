import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { TensorSlab } from '@engine/scene/TensorSlab'
import { palette, ramps } from '@engine/theme'
import { BackboneTube } from '../components/BackboneTube'
import { PairMap } from '../components/PairMap'
import { useTemplate } from '../data'

/** Algorithm 16: a real homologous structure, binned into distances. */
export const TemplatesScene = () => {
  const template = useTemplate()
  const showFeatures = useDrive('features')
  const compare = useDrive('compare')
  if (!template) return null

  return (
    <group>
      <group position={[-7.6, 0, 0]}>
        <BackboneTube points={template.backbone} scale={0.09} radius={0.14} color={palette.template} />
        <Caption
          text="template structure"
          shape="AlphaFold DB · AF-P01112-F1"
          position={[0, 3, 0]}
          color={palette.template}
          size={0.28}
        />
      </group>

      <PairMap
        id="template"
        matrix={template.templateDistances}
        label="template distances"
        shape={`${template.residues} × ${template.residues} · Å`}
        position={[-0.6, 0, 0]}
        size={5.6}
        ramp={ramps.noise}
        color={palette.template}
        smooth
      />

      <PairMap
        id="comparison"
        matrix={template.targetDistances}
        label="crystal distances"
        shape={`mean |Δd| = ${template.agreement} Å`}
        position={[6.4, 0, 0]}
        size={5.6}
        ramp={ramps.noise}
        color={palette.structure}
        visible={compare > 0.05}
        smooth
      />

      <group visible={showFeatures > 0.05} position={[-0.6, -4.1, 0]}>
        <TensorSlab
          id="features"
          values={template.bins}
          rows={1}
          columns={template.bins.length}
          ramp={ramps.noise}
          size={[5.6, 0.4]}
          smooth
        />
        <Caption
          text={`${template.binCount} distance bins · 3.25–50.75 Å`}
          position={[0, -0.85, 0]}
          color={palette.muted}
          size={0.24}
        />
        <Caption
          id="features"
          text={`${template.featureWidth} features per residue pair`}
          shape={template.features
            .map((entry) => `${entry.name.replace('template_', '')} ${entry.width}`)
            .join(' · ')}
          position={[0, 0.55, 0]}
          color={palette.template}
          size={0.25}
        />
      </group>
    </group>
  )
}
