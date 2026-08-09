import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { palette, plddtColor } from '@engine/theme'
import { BackboneTube } from '../components/BackboneTube'
import { LigandSticks } from '../components/LigandSticks'
import { useStructure } from '../data'

const SCALE = 0.14

/** Chapter one: the actual molecule, so every later tensor has something to mean. */
export const ComplexScene = () => {
  const structure = useStructure()
  const showLigand = useDrive('ligand')
  const showIon = useDrive('ion')
  const colorByAtomCount = useDrive('atomCount')
  if (!structure) return null

  const ligands = structure.ligands.filter((entry) => entry.kind === 'ligand')
  const ions = structure.ligands.filter((entry) => entry.kind === 'metal ion')

  return (
    <group>
      <BackboneTube
        points={structure.backbone}
        scale={SCALE}
        radius={0.18}
        residueColors={
          colorByAtomCount > 0.1
            ? structure.residues.map((residue) => plddtColor(residue.atomCount * 9))
            : undefined
        }
      />
      <Caption
        id="protein"
        text={`H-Ras · ${structure.counts.residues} residues`}
        shape={`chain ${structure.chain} · ${structure.counts.proteinAtoms} atoms`}
        position={[0, 4.2, 0]}
        color={palette.structure}
      />

      <group visible={showLigand > 0.05}>
        {ligands.map((ligand) => (
          <LigandSticks
            key={ligand.code + ligand.residueIndex}
            positions={ligand.position}
            elements={ligand.element}
            scale={SCALE}
          />
        ))}
        {ligands[0] && (
          <Caption
            id="ligand"
            text="GNP · GTP analogue"
            shape={`${ligands[0].atomCount} heavy atoms`}
            position={offset(centroid(ligands[0].position), [2.6, 1.5, 0])}
            color={palette.atom}
            size={0.3}
          />
        )}
      </group>

      <group visible={showIon > 0.05}>
        {ions.map((ion) => (
          <LigandSticks
            key={ion.code + ion.residueIndex}
            positions={ion.position}
            elements={ion.element}
            scale={SCALE}
            atomRadius={0.26}
          />
        ))}
        {ions[0] && (
          <Caption
            id="ion"
            text="Mg 2+"
            shape="metal ion · 1 atom"
            position={offset(centroid(ions[0].position), [-4.2, -2.4, 2.2])}
            color={palette.msa}
            size={0.28}
          />
        )}
      </group>
    </group>
  )
}

const centroid = (positions: number[][]): [number, number, number] => {
  const total = positions.reduce(
    (sum, point) => [sum[0] + point[0], sum[1] + point[1], sum[2] + point[2]],
    [0, 0, 0],
  )
  return [
    (total[0] / positions.length) * SCALE,
    (total[1] / positions.length) * SCALE,
    (total[2] / positions.length) * SCALE,
  ]
}

const offset = (
  point: [number, number, number],
  by: [number, number, number],
): [number, number, number] => [point[0] + by[0], point[1] + by[1], point[2] + by[2]]
