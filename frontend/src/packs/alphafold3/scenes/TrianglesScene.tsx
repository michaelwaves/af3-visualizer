import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances, Line } from '@react-three/drei'
import type { Group } from 'three'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { palette } from '@engine/theme'
import { PairMap } from '../components/PairMap'
import { useActivations } from '../data'

const NODES = 14
const RADIUS = 3.4

/** The triangle inequality, made literal: edge (i,j) updated through every k. */
export const TrianglesScene = () => {
  const activations = useActivations()
  const showTriangle = useDrive('triangle')
  const showMultiply = useDrive('multiply')
  const showAttend = useDrive('attend')

  // The ring stands in the XY plane so the triangle reads face-on, like the maps.
  const points = useMemo(
    () =>
      Array.from({ length: NODES }, (_, index) => {
        const angle = (index / NODES) * Math.PI * 2
        return [Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0] as [number, number, number]
      }),
    [],
  )

  return (
    <group>
      <group position={[-5.4, 0, 0]}>
        <Instances limit={NODES} range={NODES}>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshStandardMaterial roughness={0.3} emissiveIntensity={0.4} />
          {points.map((point, index) => (
            <Instance
              key={index}
              position={point}
              color={index === 0 || index === 5 ? palette.single : '#5c6577'}
            />
          ))}
        </Instances>

        <Line points={[points[0], points[5]]} color={palette.pair} lineWidth={3} />
        <Caption text="i" position={[points[0][0] * 1.22, points[0][1] * 1.22, 0]} size={0.32} />
        <Caption text="j" position={[points[5][0] * 1.22, points[5][1] * 1.22, 0]} size={0.32} />

        {showTriangle > 0.05 && <SweepingK points={points} intensity={showTriangle} />}

        <Caption
          id="triangle"
          text="edge (i,j)  ←  sum over k of  f( (i,k), (j,k) )"
          position={[0, -RADIUS - 1.2, 0]}
          color={palette.pair}
          size={0.28}
        />
      </group>

      <PairMap
        id="multiply"
        matrix={activations?.pairMaps.triangle_multiplication_outgoing ?? []}
        label="triangle multiplication"
        shape="outgoing · incoming"
        position={[2.4, 2.6, 0]}
        size={4.4}
        visible={showMultiply > 0.05}
      />

      <PairMap
        id="attend"
        matrix={activations?.attentionHeads.attention_0 ?? []}
        label="triangle attention"
        shape="starting node · head 0"
        position={[8, -2.4, 0]}
        size={4.4}
        visible={showAttend > 0.05}
        smooth
      />
    </group>
  )
}

/** A third vertex k orbiting the ring, closing a new triangle each frame. */
const SweepingK = ({
  points,
  intensity,
}: {
  points: [number, number, number][]
  intensity: number
}) => {
  const group = useRef<Group>(null)
  const index = useRef(1)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    if (elapsed.current > 0.42) {
      elapsed.current = 0
      index.current = (index.current + 1) % points.length
      if (index.current === 0 || index.current === 5) index.current += 1
    }
    if (group.current) group.current.position.set(...points[index.current])
  })

  const k = points[index.current]

  return (
    <group>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[0.24, 14, 14]} />
          <meshBasicMaterial color={palette.template} />
        </mesh>
      </group>
      <Line points={[points[0], k]} color={palette.template} lineWidth={2} opacity={intensity} transparent />
      <Line points={[points[5], k]} color={palette.template} lineWidth={2} opacity={intensity} transparent />
      <Caption
        text="k"
        position={[k[0] * 1.25, k[1] * 1.25, 0]}
        color={palette.template}
        size={0.3}
      />
    </group>
  )
}
