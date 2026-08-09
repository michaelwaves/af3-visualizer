import { Instance, Instances } from '@react-three/drei'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { palette } from '@engine/theme'
import { useModel } from '../data'

const TOKEN_WIDTH = 0.075
const ATOM_SIZE = 0.055

/** The token/atom duality: one row of tokens, one row of the atoms they own. */
export const TokensScene = () => {
  const model = useModel()
  const showLigand = useDrive('ligand')
  const showAtoms = useDrive('atoms')
  const showWindows = useDrive('windows')
  const showPool = useDrive('pool')
  if (!model) return null

  const lens = model.measured.moleculeAtomLens
  const proteinTokens = lens.length - Math.round(model.input.tokens * model.measured.isMoleculeTypes[3])
  const span = lens.length * TOKEN_WIDTH

  return (
    <group position={[-span / 2, 0, 0]}>
      <Instances limit={lens.length} range={lens.length} position={[0, 1.6, 0]}>
        <boxGeometry args={[TOKEN_WIDTH * 0.82, 0.34, 0.9]} />
        <meshStandardMaterial roughness={0.4} />
        {lens.map((_, index) => (
          <Instance
            key={index}
            position={[index * TOKEN_WIDTH, 0, 0]}
            color={
              index < proteinTokens
                ? palette.single
                : showLigand > 0.1
                  ? palette.atom
                  : palette.line
            }
          />
        ))}
      </Instances>
      <Caption
        id="tokens"
        text="tokens"
        shape={`n = ${model.input.tokens}`}
        position={[span / 2, 2.3, 0]}
        color={palette.single}
      />
      <Caption
        id="ligandTokens"
        text="ligand + ion → one token per atom"
        position={[span * 0.92, 1.1, 1.4]}
        color={palette.atom}
        size={0.24}
        visible={showLigand > 0.1}
      />

      <group visible={showAtoms > 0.05} position={[0, -0.6, 0]}>
        <AtomRow lens={lens} proteinTokens={proteinTokens} reveal={showAtoms} />
        <Caption
          text="atoms"
          shape={`m = ${model.input.atoms}`}
          position={[span / 2, -1.5, 0]}
          color={palette.atom}
        />
      </group>

      <group visible={showWindows > 0.05}>
        <WindowBrackets count={model.input.windows} atomsPerWindow={model.dimensions.atomsPerWindow} />
      </group>

      <group visible={showPool > 0.05}>
        <Caption
          text="atoms pool up to tokens · tokens broadcast back down"
          position={[span / 2, 0.55, 2.6]}
          color={palette.muted}
          size={0.26}
        />
      </group>
    </group>
  )
}

/** Each token's atoms fanned out beneath it, so the ownership is visible. */
const AtomRow = ({
  lens,
  proteinTokens,
  reveal,
}: {
  lens: number[]
  proteinTokens: number
  reveal: number
}) => {
  const positions: { x: number; z: number; ligand: boolean }[] = []
  let cursor = 0
  lens.forEach((count, token) => {
    for (let atom = 0; atom < count; atom++) {
      positions.push({
        x: cursor * TOKEN_WIDTH * 0.147,
        z: (atom - count / 2) * 0.16,
        ligand: token >= proteinTokens,
      })
      cursor++
    }
  })
  const shown = Math.round(positions.length * reveal)

  return (
    <Instances limit={positions.length} range={shown}>
      <sphereGeometry args={[ATOM_SIZE, 6, 6]} />
      <meshStandardMaterial roughness={0.45} />
      {positions.map((position, index) => (
        <Instance
          key={index}
          position={[position.x, 0, position.z]}
          color={position.ligand ? palette.atom : palette.structure}
        />
      ))}
    </Instances>
  )
}

const WindowBrackets = ({
  count,
  atomsPerWindow,
}: {
  count: number
  atomsPerWindow: number
}) => (
  <group position={[0, -1.05, 0]}>
    <Instances limit={count} range={count}>
      <boxGeometry args={[atomsPerWindow * TOKEN_WIDTH * 0.135, 0.035, 0.04]} />
      <meshBasicMaterial color={palette.template} />
      {Array.from({ length: count }, (_, index) => (
        <Instance key={index} position={[index * atomsPerWindow * TOKEN_WIDTH * 0.147, 0, 1.4]} />
      ))}
    </Instances>
    <Caption
      text={`${count} windows × ${atomsPerWindow} atoms`}
      position={[count * atomsPerWindow * TOKEN_WIDTH * 0.074, -0.6, 1.4]}
      color={palette.template}
      size={0.24}
    />
  </group>
)
