import { Text } from '@react-three/drei'
import { useDrive } from '@engine/hooks'
import { Caption } from '@engine/scene/Caption'
import { palette } from '@engine/theme'
import { useStructure } from '../data'
import { InputField } from './inputs/InputField'
import { wrap } from './inputs/wrap'

/** The GNP SMILES handed to the featuriser, as in `data/raw/alphafold3_input.py`. */
const GNP_SMILES = 'Nc1nc2c(ncn2C2OC(COP(=O)(O)OP(=O)(O)NP(=O)(O)O)C(O)C2O)c(=O)[nH]1'

/** Both values wrap at the same width, so the block reads as one form. */
const COLUMNS = 34
const BRACKET_X = -2.95

/**
 * The opening scene: what `Alphafold3Input` is actually given. Three strings and
 * no coordinates — which is the whole point, and impossible to see from a
 * picture of a finished structure.
 */
export const InputsScene = () => {
  const structure = useStructure()
  const showLigand = useDrive('ligand')
  const showIon = useDrive('ion')
  if (!structure) return null

  return (
    <group>
      <Bracket y={2.35} text="Alphafold3Input(" />

      <InputField
        id="protein"
        label="proteins ="
        y={1.95}
        lines={wrap(structure.sequence, COLUMNS)}
        badge={`${structure.sequence.length} residues · 1,321 atoms`}
        color={palette.single}
      />

      <InputField
        id="ligand"
        label="ligands ="
        y={0.15}
        lines={wrap(GNP_SMILES, COLUMNS)}
        badge="GNP · 32 heavy atoms"
        color={palette.atom}
        opacity={showLigand}
      />

      <InputField
        id="ion"
        label="metal_ions ="
        y={-0.85}
        lines={['Mg']}
        badge="1 atom"
        color={palette.confidence}
        opacity={showIon}
      />

      <Bracket y={-1.6} text=")" />

      <Caption
        text="no coordinates anywhere"
        position={[0, -2.15, 0]}
        color={palette.muted}
        size={0.22}
      />
    </group>
  )
}

const Bracket = ({ y, text }: { y: number; text: string }) => (
  <Text position={[BRACKET_X, y, 0]} anchorX="left" anchorY="top" fontSize={0.2} color={palette.muted}>
    {text}
  </Text>
)
