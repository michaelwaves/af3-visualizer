import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances, Line } from '@react-three/drei'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { Flow } from '@engine/scene/Flow'
import { palette } from '@engine/theme'
import { useDiffusion, useModel } from '../data'

const STAGES = [
  { id: 'encoder', label: 'atom encoder', shape: '3 blocks · window 27', color: palette.atom, x: -6.4 },
  { id: 'token', label: 'token transformer', shape: '24 blocks · 768 · 16 heads', color: palette.single, x: 0 },
  { id: 'decoder', label: 'atom decoder', shape: '3 blocks · → 3 coords', color: palette.atom, x: 6.4 },
]

/** Algorithm 20, plus the real sampling trajectory it produces. */
export const DiffusionScene = () => {
  const model = useModel()
  const diffusion = useDiffusion()
  const conditioning = useDrive('conditioning')
  const showTrajectory = useDrive('trajectory')
  const drives = {
    encoder: useDrive('encoder'),
    token: useDrive('token'),
    decoder: useDrive('decoder'),
  }
  if (!model || !diffusion) return null

  return (
    <group>
      <group position={[0, 2.6, 0]} visible={showTrajectory < 0.15}>
        {STAGES.map((stage) => (
          <group key={stage.id} position={[stage.x, 0, 0]}>
            <mesh visible={drives[stage.id as keyof typeof drives] > 0.05}>
              <boxGeometry args={[3.6, 1.5, 3]} />
              <meshStandardMaterial color={stage.color} roughness={0.5} transparent opacity={0.85} />
            </mesh>
            <Caption
              id={stage.id}
              text={stage.label}
              shape={stage.shape}
              position={[0, 1.2, -1.9]}
              color={stage.color}
              size={0.27}
              visible={drives[stage.id as keyof typeof drives] > 0.05}
            />
          </group>
        ))}

        <Flow from={[-4.6, 0, 0]} to={[-1.8, 0, 0]} color={palette.atom} progress={drives.token} label="pool to tokens" expression="[m, 128] → [n, 768]" />
        <Flow from={[1.8, 0, 0]} to={[4.6, 0, 0]} color={palette.single} progress={drives.decoder} label="broadcast to atoms" expression="[n, 768] → [m, 3]" />

        <group visible={conditioning > 0.05}>
          <Caption
            id="conditioning"
            text="conditioned on single · pairwise · relpos · Fourier(σ)"
            position={[0, -1.9, 2.4]}
            color={palette.muted}
            size={0.26}
          />
        </group>
        <Caption
          id="module"
          text="diffusion module"
          shape={`${model.modules.find((m) => m.name === 'diffusion_module')?.parameters.toLocaleString()} parameters`}
          position={[0, 2.6, 0]}
          color={palette.noise}
        />
      </group>

      <group visible={showTrajectory > 0.15}>
        <Trajectory diffusion={diffusion} />
      </group>
    </group>
  )
}

/** Plays the measured sampler path: 33 frames of real atom positions. */
const Trajectory = ({
  diffusion,
}: {
  diffusion: { steps: number[][][]; sigmas: number[]; radiusOfGyration: number[] }
}) => {
  const [frame, setFrame] = useState(0)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (elapsed.current > 0.16) {
      elapsed.current = 0
      setFrame((current) => (current + 1) % diffusion.steps.length)
    }
  })

  const positions = diffusion.steps[frame]
  const radius = diffusion.radiusOfGyration[frame]
  // Each frame is normalised by its own extent, so the collapse reads as shape
  // change rather than the structure simply shrinking out of view.
  const scale = 2.1 / Math.max(radius, 0.001)

  const rgTrace = useMemo(
    () =>
      diffusion.radiusOfGyration.map((value, index) => {
        const x = (index / (diffusion.radiusOfGyration.length - 1)) * 6 - 3
        return [x, Math.log10(Math.max(value, 0.1)) * 0.7 - 1.4, 0] as [number, number, number]
      }),
    [diffusion.radiusOfGyration],
  )

  return (
    <group>
      <group position={[-3.4, 0.6, 0]}>
        <Instances limit={positions.length} range={positions.length}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color={palette.noise} />
          {positions.map((position, index) => (
            <Instance
              key={index}
              position={[position[0] * scale, position[1] * scale, position[2] * scale]}
            />
          ))}
        </Instances>
        <Caption
          id="trajectory"
          text={`step ${frame} / ${diffusion.steps.length - 1}`}
          shape={`σ = ${diffusion.sigmas[Math.min(frame, diffusion.sigmas.length - 1)].toFixed(2)} · Rg = ${radius.toFixed(1)} Å`}
          position={[0, 4, 0]}
          color={palette.noise}
          size={0.3}
        />
      </group>

      <group position={[5.4, 0.6, 0]}>
        <Line points={rgTrace} color={palette.noise} lineWidth={3} />
        <mesh position={rgTrace[frame]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshBasicMaterial color={palette.text} />
        </mesh>
        <Caption
          text="radius of gyration"
          shape="log scale · 2,232 Å → 19.9 Å"
          position={[0, 1.6, 0]}
          color={palette.muted}
          size={0.25}
        />
      </group>
    </group>
  )
}
