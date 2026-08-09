import { useMemo } from 'react'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { palette, plddtColor, ramps } from '@engine/theme'
import { BackboneTube } from '../components/BackboneTube'
import { PairMap } from '../components/PairMap'
import { usePredictions, useStructure } from '../data'

/** Algorithm 31: pLDDT on the chain, PAE and the distogram beside it. */
export const ConfidenceScene = () => {
  const structure = useStructure()
  const predictions = usePredictions()
  const showPlddt = useDrive('plddt')
  const showPae = useDrive('pae')
  const showDistogram = useDrive('distogram')

  const residueColors = useMemo(() => {
    if (!structure || !predictions) return undefined
    // pLDDT is per atom; colour each residue by the mean over the atoms it owns.
    let cursor = 0
    return structure.residues.map((residue) => {
      const slice = predictions.plddt.slice(cursor, cursor + residue.atomCount)
      cursor += residue.atomCount
      const mean = slice.reduce((total, value) => total + value, 0) / (slice.length || 1)
      return plddtColor(mean)
    })
  }, [structure, predictions])

  if (!structure || !predictions) return null

  return (
    <group>
      <group position={[-7.4, 0, 0]}>
        <BackboneTube
          points={structure.backbone}
          scale={0.11}
          radius={0.15}
          residueColors={showPlddt > 0.05 ? residueColors : undefined}
        />
        <Caption
          id="plddt"
          text="pLDDT"
          shape={`50 bins · ${predictions.atomCount} atoms`}
          position={[0, 3.2, 0]}
          color={palette.confidence}
          size={0.3}
        />
      </group>

      <PairMap
        id="pae"
        matrix={predictions.pae ?? []}
        label="predicted aligned error"
        shape="64 bins · 0.5–32 Å"
        position={[0, 0, 0]}
        size={5.4}
        ramp={ramps.pae}
        color={palette.confidence}
        visible={showPae > 0.05}
        smooth
      />

      <PairMap
        id="distogram"
        matrix={predictions.distogram}
        label="distogram"
        shape="64 bins · 2–22 Å"
        position={[7, 0, 0]}
        size={5.4}
        color={palette.pair}
        visible={showDistogram > 0.05}
        smooth
      />
    </group>
  )
}
