import type { Chapter } from '@engine/types'

export const tokenChapters: Chapter[] = [
  {
    id: 'tokens',
    title: 'Tokens and atoms',
    blurb: 'The one idea that lets a protein, a drug and an ion share a sequence model.',
    section: 'Inputs',
    scene: 'tokens',
    beats: [
      {
        id: 'problem',
        text: 'A language model has one kind of token. AlphaFold 3 has to describe a polymer whose units are residues *and* a small molecule whose units are atoms. It solves this by keeping two sequences at once.',
        camera: { position: [0, 8.5, 23], target: [0, 0, 0] },
      },
      {
        id: 'residue-token',
        text: 'A standard amino acid is *one token*, no matter how many atoms it holds. Glycine brings 4 heavy atoms; tryptophan brings 14. Both are a single token.',
        highlight: ['tokens'],
        shape: { name: 'molecule_atom_lens', dims: ['b', 'n'], note: 'one integer per token: how many atoms it owns' },
      },
      {
        id: 'ligand-token',
        text: 'A ligand is different: *every heavy atom becomes its own token*. GNP contributes 32 tokens, not one. The model needs per-atom resolution for chemistry it has never seen.',
        highlight: ['ligandTokens'],
        drive: ['ligand'],
      },
      {
        id: 'arithmetic',
        text: '166 residues + 32 ligand atoms + 1 magnesium = *199 tokens*. Those tokens expand to 1,354 atoms. Both counts are measured from the repository featuriser, not assumed.',
        drive: ['ligand', 'atoms'],
        shape: { name: 'tokens → atoms', dims: ['n', 'm'] },
      },
      {
        id: 'windows',
        text: 'Atom-level attention over 1,354 atoms would be wasteful, so the atom transformer attends inside *sequence-local windows* of 27 — one tryptophan\'s worth of atoms — with each window also seeing its neighbour.',
        drive: ['ligand', 'atoms', 'windows'],
        shape: {
          name: 'atompair_inputs',
          dims: ['b', 'nw', 'w', '2w', 'dapi'],
          sizes: [1, 51, 27, 54, 5],
          note: '51 windows of 27 atoms, each attending across 54',
        },
      },
      {
        id: 'pooling',
        text: 'Everything downstream lives in token space. Atom features are pooled up to tokens before the trunk, and pushed back down to atoms in the diffusion decoder.',
        drive: ['ligand', 'atoms', 'windows', 'pool'],
      },
    ],
  },
  {
    id: 'features',
    title: 'What actually goes in',
    blurb: 'Six tensors, and none of them is a structure.',
    section: 'Inputs',
    scene: 'features',
    beats: [
      {
        id: 'intro',
        text: 'The featuriser turns the complex into a handful of plain arrays. This is the entire input surface of the model.',
        camera: { position: [0, 15, 25], target: [0, 0, 0.4] },
      },
      {
        id: 'atom-inputs',
        text: 'Per atom: a small reference-conformer feature vector. In this configuration it is 3 numbers wide — the atom\'s position in an idealised copy of its own residue.',
        highlight: ['atom_inputs'],
        shape: { name: 'atom_inputs', dims: ['b', 'm', 'dai'] },
      },
      {
        id: 'atompair',
        text: 'Per atom pair: 5 numbers describing bonded distance and whether the two atoms share a residue — enough to encode covalent structure without a graph network.',
        highlight: ['atompair_inputs'],
        shape: { name: 'atompair_inputs', dims: ['b', 'nw', 'w', '2w', 'dapi'] },
      },
      {
        id: 'token-feats',
        text: 'Per token: 33 extra numbers — a 32-way amino-acid *profile* summarising the alignment column, plus the mean deletion count. This is the real profile, computed over all 15,953 aligned sequences; the brightest cells are columns where one residue is fixed across the tree of life.',
        highlight: ['additional_token_feats'],
        shape: { name: 'additional_token_feats', dims: ['b', 'n', 'dtf'] },
      },
      {
        id: 'molecule-feats',
        text: 'Per token: five integers that place it in the assembly — residue index, token index, asym id, entity id, sym id. These are what let the model reason about chains and copies.',
        highlight: ['additional_molecule_feats'],
        shape: { name: 'additional_molecule_feats', dims: ['b', 'n', '5'], sizes: [1, 199, 5] },
      },
      {
        id: 'types',
        text: 'And a 5-way type flag per token: protein, RNA, DNA, ligand, metal ion. Measured on this complex: *83.4%* protein, *16.1%* ligand, one lone ion. The RNA and DNA columns are simply empty — same tensor, same model.',
        highlight: ['is_molecule_types'],
        shape: { name: 'is_molecule_types', dims: ['b', 'n', '5'], sizes: [1, 199, 5] },
      },
      {
        id: 'no-structure',
        text: 'Notice what is *absent*: no coordinates, no secondary structure, no contact map. The structure is what comes out, never what goes in.',
      },
    ],
  },
]
