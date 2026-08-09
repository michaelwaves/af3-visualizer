import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { CatmullRomCurve3, Vector3 } from 'three'
import { palette } from '@engine/theme'

export interface BackboneTubeProps {
  /** Alpha-carbon positions in ångström, already centred. */
  points: number[][]
  scale?: number
  radius?: number
  color?: string
  /** One colour per residue, drawn as beads along the chain (pLDDT, conservation…). */
  residueColors?: string[]
  opacity?: number
}

const SEGMENTS_PER_RESIDUE = 4

/**
 * Draws a protein chain as a smooth tube through its alpha carbons — the
 * cartoon read of a fold, without the cost of full secondary-structure ribbons.
 */
export const BackboneTube = ({
  points,
  scale = 0.12,
  radius = 0.16,
  color = palette.structure,
  residueColors,
  opacity = 1,
}: BackboneTubeProps) => {
  const curve = useMemo(
    () => new CatmullRomCurve3(points.map((point) => new Vector3(...point).multiplyScalar(scale))),
    [points, scale],
  )
  const segments = Math.max(8, points.length * SEGMENTS_PER_RESIDUE)

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, segments, radius, 10, false]} />
        <meshStandardMaterial
          color={color}
          roughness={0.45}
          metalness={0.1}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {residueColors && (
        <Instances limit={points.length} range={points.length}>
          <sphereGeometry args={[radius * 1.7, 10, 10]} />
          <meshStandardMaterial roughness={0.4} transparent={opacity < 1} opacity={opacity} />
          {points.map((point, index) => (
            <Instance
              key={index}
              position={[point[0] * scale, point[1] * scale, point[2] * scale]}
              color={residueColors[index] ?? color}
            />
          ))}
        </Instances>
      )}
    </group>
  )
}
