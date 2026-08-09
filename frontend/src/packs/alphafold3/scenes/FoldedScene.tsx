import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { palette, plddtColor, ramps } from '@engine/theme'
import { BackboneTube } from '../components/BackboneTube'
import { LigandSticks } from '../components/LigandSticks'
import { PairMap } from '../components/PairMap'
import { useBoltz, useStructure } from '../data'

const SCALE = 0.13

/** A structure a trained model actually produced, next to its confidence. */
export const FoldedScene = () => {
  const boltz = useBoltz()
  const structure = useStructure()
  const showConfidence = useDrive('confidence')
  const showCrystal = useDrive('crystal')
  const showPae = useDrive('pae')
  if (!boltz) return null

  return (
    <group>
      <group position={[-6.4, -0.4, 0]}>
        <BackboneTube
          points={boltz.backbone}
          scale={SCALE}
          radius={0.17}
          residueColors={
            showConfidence > 0.05 ? boltz.residuePlddt.map((value) => plddtColor(value)) : undefined
          }
        />
        {boltz.ligands.map((ligand) => (
          <LigandSticks
            key={ligand.code}
            positions={ligand.position}
            elements={ligand.element}
            scale={SCALE}
            atomRadius={ligand.kind === 'metal ion' ? 0.26 : 0.17}
          />
        ))}
        <Caption
          id="folded"
          text={`${boltz.model.name} prediction`}
          shape={`pLDDT ${boltz.confidence.complexPlddt} · pTM ${boltz.confidence.ptm} · ipTM ${boltz.confidence.iptm}`}
          position={[0, 3.6, 0]}
          color={palette.structure}
          size={0.32}
        />
      </group>

      {structure && (
        <group position={[0.6, -0.4, 0]} visible={showCrystal > 0.05}>
          <BackboneTube
            points={structure.backbone}
            scale={SCALE}
            radius={0.15}
            color={palette.template}
            opacity={0.9}
          />
          <Caption
            id="crystal"
            text="crystal structure"
            shape={`721P · CA RMSD ${boltz.rmsdToCrystal} Å`}
            position={[0, 3.6, 0]}
            color={palette.template}
            size={0.3}
          />
        </group>
      )}

      <PairMap
        id="pae"
        matrix={boltz.pae}
        label="predicted aligned error"
        shape="199 × 199 · Å"
        position={[7.4, -0.4, 0]}
        size={5.4}
        ramp={ramps.pae}
        color={palette.confidence}
        visible={showPae > 0.05}
        smooth
      />
    </group>
  )
}
