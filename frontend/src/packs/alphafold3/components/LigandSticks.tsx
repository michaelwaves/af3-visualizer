import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'

export const ELEMENT_COLORS: Record<string, string> = {
  C: '#8b93a5', N: '#5b8dee', O: '#f0664f', P: '#f5a524', S: '#f5d90a',
  MG: '#7bd88f', ZN: '#a78bfa', FE: '#e07a5f', NA: '#60a5fa', CA: '#4fd1c5',
}

const BOND_CUTOFF = 1.95 // ångström between heavy atoms

export interface LigandSticksProps {
  positions: number[][]
  elements: string[]
  scale?: number
  atomRadius?: number
  bondRadius?: number
}

/** Ball-and-stick rendering for ligands and ions, bonded by interatomic distance. */
export const LigandSticks = ({
  positions,
  elements,
  scale = 0.12,
  atomRadius = 0.17,
  bondRadius = 0.06,
}: LigandSticksProps) => {
  const points = useMemo(
    () => positions.map((position) => new Vector3(...position).multiplyScalar(scale)),
    [positions, scale],
  )
  const bonds = useMemo(() => findBonds(points, scale), [points, scale])

  return (
    <group>
      <Instances limit={points.length} range={points.length}>
        <sphereGeometry args={[atomRadius, 14, 14]} />
        <meshStandardMaterial roughness={0.32} metalness={0.15} />
        {points.map((point, index) => (
          <Instance key={index} position={point} color={colorFor(elements[index])} />
        ))}
      </Instances>

      <Instances limit={Math.max(1, bonds.length)} range={bonds.length}>
        <cylinderGeometry args={[bondRadius, bondRadius, 1, 8]} />
        <meshStandardMaterial color="#666e80" roughness={0.5} />
        {bonds.map((bond, index) => (
          <Instance
            key={index}
            position={bond.midpoint}
            quaternion={bond.orientation}
            scale={[1, bond.length, 1]}
          />
        ))}
      </Instances>
    </group>
  )
}

export const colorFor = (element: string): string =>
  ELEMENT_COLORS[element.toUpperCase()] ?? '#8b93a5'

const UP = new Vector3(0, 1, 0)

const findBonds = (points: Vector3[], scale: number) => {
  const cutoff = BOND_CUTOFF * scale
  const bonds: { midpoint: Vector3; orientation: Quaternion; length: number }[] = []

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const length = points[i].distanceTo(points[j])
      if (length > cutoff) continue
      const direction = points[j].clone().sub(points[i]).normalize()
      bonds.push({
        midpoint: points[i].clone().lerp(points[j], 0.5),
        orientation: new Quaternion().setFromUnitVectors(UP, direction),
        length,
      })
    }
  }
  return bonds
}
