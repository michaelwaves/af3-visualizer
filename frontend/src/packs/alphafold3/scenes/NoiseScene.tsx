import { useMemo } from 'react'
import { Instance, Instances, Line } from '@react-three/drei'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { palette } from '@engine/theme'
import { BackboneTube } from '../components/BackboneTube'
import { useDiffusion, useStructure } from '../data'

/** The noise schedule, and what a structure looks like part-way up it. */
export const NoiseScene = () => {
  const structure = useStructure()
  const diffusion = useDiffusion()
  const cloud = useDrive('cloud')
  const augment = useDrive('augment')
  const schedule = useDrive('schedule')
  const precondition = useDrive('precondition')
  if (!structure || !diffusion) return null

  return (
    <group>
      <group position={[-5.5, 0, 0]}>
        <BackboneTube points={structure.backbone} scale={0.1} radius={0.13} opacity={1 - cloud * 0.75} />
        <NoisyAtoms structure={structure} amount={cloud} />
        <Caption
          id="cloud"
          text={cloud > 0.5 ? 'noised coordinates' : 'true coordinates'}
          shape="[b, m, 3]"
          position={[0, 5.4, 0]}
          color={cloud > 0.5 ? palette.noise : palette.structure}
          size={0.3}
        />
        <Caption
          id="augment"
          text="+ random rotation and translation, 48×"
          position={[0, -5.4, 0]}
          color={palette.muted}
          size={0.25}
          visible={augment > 0.1}
        />
      </group>

      <group position={[6.2, 2.4, 0]} visible={schedule > 0.05}>
        <ScheduleCurve sigmas={diffusion.sigmas} />
        <Caption
          id="schedule"
          text="noise schedule"
          shape={`σ: ${diffusion.sigmas[0].toLocaleString()} → 0 · ρ = ${diffusion.rho}`}
          position={[0, 2.2, 0]}
          color={palette.noise}
          size={0.28}
        />
      </group>

      <group position={[6.2, -3.6, 0]} visible={precondition > 0.05}>
        <PreconditioningCurves data={diffusion.preconditioning} />
        <Caption
          id="precondition"
          text="c_skip · c_in"
          shape="Karras preconditioning"
          position={[0, 1.2, 0]}
          color={palette.confidence}
          size={0.25}
        />
      </group>
    </group>
  )
}

/** Atoms displaced along their own fixed random direction, so noise reads as noise. */
const NoisyAtoms = ({ structure, amount }: { structure: { backbone: number[][] }; amount: number }) => {
  const offsets = useMemo(
    () =>
      structure.backbone.map((_, index) => {
        const seed = index * 2654435761
        return [
          ((seed % 1000) / 1000 - 0.5) * 2,
          (((seed >> 8) % 1000) / 1000 - 0.5) * 2,
          (((seed >> 16) % 1000) / 1000 - 0.5) * 2,
        ]
      }),
    [structure.backbone],
  )
  if (amount < 0.02) return null

  return (
    <Instances limit={structure.backbone.length} range={structure.backbone.length}>
      <sphereGeometry args={[0.11, 8, 8]} />
      <meshBasicMaterial color={palette.noise} transparent opacity={amount} />
      {structure.backbone.map((point, index) => (
        <Instance
          key={index}
          position={[
            point[0] * 0.1 + offsets[index][0] * amount * 5,
            point[1] * 0.1 + offsets[index][1] * amount * 5,
            point[2] * 0.1 + offsets[index][2] * amount * 5,
          ]}
        />
      ))}
    </Instances>
  )
}

/** log σ against step, which is where the ρ = 7 crowding becomes visible. */
const ScheduleCurve = ({ sigmas }: { sigmas: number[] }) => {
  const points = useMemo(
    () =>
      sigmas.map((sigma, index) => {
        const x = (index / (sigmas.length - 1)) * 7 - 3.5
        const y = (Math.log10(Math.max(sigma, 0.01)) + 2) * 0.72 - 1.4
        return [x, y, 0] as [number, number, number]
      }),
    [sigmas],
  )

  return (
    <group>
      <Line points={points} color={palette.noise} lineWidth={3} />
      <Instances limit={points.length} range={points.length}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={palette.noise} />
        {points.map((point, index) => (
          <Instance key={index} position={point} />
        ))}
      </Instances>
      <Caption text="log σ" position={[-3.9, 1.4, 0]} color={palette.muted} size={0.22} />
      <Caption text="step" position={[3.6, -2.1, 0]} color={palette.muted} size={0.22} />
    </group>
  )
}

const PreconditioningCurves = ({
  data,
}: {
  data: { sigma: number; cSkip: number; cOut: number; cIn: number }[]
}) => {
  const curve = (key: 'cSkip' | 'cIn') =>
    data.map((entry, index) => {
      const x = (index / (data.length - 1)) * 7 - 3.5
      return [x, entry[key] * 1.4 - 0.7, 0] as [number, number, number]
    })

  return (
    <group>
      <Line points={curve('cSkip')} color={palette.confidence} lineWidth={2.4} />
      <Line points={curve('cIn')} color={palette.pair} lineWidth={2.4} />
    </group>
  )
}
