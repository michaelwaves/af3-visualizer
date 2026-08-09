/** Every einops axis symbol the codebase uses, with its concrete size for 721p.
 *
 * The wording follows the `global ein notation` legend at the top of
 * `alphafold3_pytorch/alphafold3.py`, so hovering a symbol here tells you the
 * same thing reading the source would.
 */

export interface Dimension {
  symbol: string
  name: string
  meaning: string
  value?: number
  origin?: string
}

const DIMENSIONS: Dimension[] = [
  { symbol: 'b', name: 'batch', meaning: 'Batch size. One complex per pass here.', value: 1 },
  {
    symbol: 'n',
    name: 'tokens',
    meaning:
      'Molecule sequence length. One token per amino acid, per nucleotide, and one per heavy atom of every ligand and ion.',
    value: 199,
    origin: '166 residues + 32 ligand atoms + 1 Mg²⁺',
  },
  { symbol: 'i', name: 'token (source)', meaning: 'Row index over tokens in a pair map.', value: 199 },
  { symbol: 'j', name: 'token (target)', meaning: 'Column index over tokens in a pair map.', value: 199 },
  {
    symbol: 'm',
    name: 'atoms',
    meaning: 'Atom sequence length — every heavy atom in the complex.',
    value: 1354,
  },
  {
    symbol: 's',
    name: 'MSA rows',
    meaning: 'Sequences in the multiple sequence alignment fed to the trunk.',
    value: 64,
    origin: 'top 64 of 15,953 ColabFold hits',
  },
  { symbol: 't', name: 'templates', meaning: 'Structural templates supplied to the trunk.', value: 1 },
  { symbol: 'h', name: 'heads', meaning: 'Attention heads.' },
  { symbol: 'l', name: 'distogram bins', meaning: 'Number of distance bins a head predicts.', value: 64 },
  {
    symbol: 'nw',
    name: 'windows',
    meaning: 'Windowed atom sequence length — atoms grouped into local blocks for attention.',
    value: 51,
    origin: 'ceil(1354 / 27)',
  },
  { symbol: 'w', name: 'window width', meaning: 'Atoms per attention window.', value: 27 },
  { symbol: 'ts', name: 'diffusion timesteps', meaning: 'Sampling steps taken by the diffusion sampler.', value: 32 },
  { symbol: 'd', name: 'feature dim', meaning: 'A generic feature dimension.' },
  { symbol: 'ds', name: 'single dim', meaning: 'Feature dimension of the single (per-token) representation.', value: 384 },
  { symbol: 'dp', name: 'pairwise dim', meaning: 'Feature dimension of the pairwise (token × token) representation.', value: 128 },
  { symbol: 'da', name: 'atom dim', meaning: 'Feature dimension of the per-atom representation.', value: 128 },
  { symbol: 'dai', name: 'atom input dim', meaning: 'Width of the raw per-atom input feature.', value: 3 },
  { symbol: 'dap', name: 'atompair dim', meaning: 'Feature dimension of the atom × atom representation.', value: 16 },
  { symbol: 'dapi', name: 'atompair input dim', meaning: 'Width of the raw atom-pair input feature.', value: 5 },
  { symbol: 'dm', name: 'MSA dim', meaning: 'Feature dimension of the MSA representation inside the MSA module.', value: 64 },
  { symbol: 'dmi', name: 'MSA input dim', meaning: 'Width of the one-hot MSA input: 21 amino acid + 5 RNA + 5 DNA + gap.', value: 32 },
  { symbol: 'dmf', name: 'MSA extra feats', meaning: 'Per MSA token pair: has_deletion and deletion_value.', value: 2 },
  { symbol: 'dtf', name: 'token extra feats', meaning: 'Per token, derived from the alignment: the 32-wide profile plus deletion_mean.', value: 33 },
  { symbol: 'dsi', name: 'single input dim', meaning: 'Width of the concatenated raw single input, before projection to ds.', value: 417 },
  { symbol: 'dst', name: 'single trunk dim', meaning: 'Single representation coming out of the trunk.', value: 384 },
  { symbol: 'dpt', name: 'pairwise trunk dim', meaning: 'Pairwise representation coming out of the trunk.', value: 128 },
  { symbol: 'dpr', name: 'rel-pos dim', meaning: 'Relative position encoding width.', value: 128 },
  { symbol: 'dt', name: 'template feats', meaning: 'Width of the per-template pair feature.', value: 108 },
  { symbol: 'dtok', name: 'token transformer dim', meaning: 'Width inside the diffusion token transformer.', value: 768 },
  { symbol: 'dac', name: 'constraint dim', meaning: 'Additional pairwise token constraint embeddings.' },
  { symbol: 'r', name: 'registers', meaning: 'Extra learned tokens attention can attend to.' },
  { symbol: '3', name: 'coordinates', meaning: 'Cartesian x, y, z in ångström.', value: 3 },
]

export const GLOSSARY: Record<string, Dimension> = Object.fromEntries(
  DIMENSIONS.map((dimension) => [dimension.symbol, dimension]),
)

export const lookupDimension = (symbol: string): Dimension | undefined => GLOSSARY[symbol]
