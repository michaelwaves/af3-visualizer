import type { Step } from '../types'

/** The pairwise stream is seeded with position, bonds and the recycled state. */
export const pairInitSteps: Step[] = [
  {
    id: 'relative_position_encoding',
    stage: 'embed',
    title: 'Encode who is next to whom',
    module: 'RelativePositionEncoding',
    algorithm: 'Algorithm 3',
    sourceSymbol: 'RelativePositionEncoding.forward',
    traceId: 'relative_position_encoding',
    summary: 'Clipped relative residue, token and chain offsets, one-hot then projected to 128.',
    detail: [
      'The pair map needs to know sequence separation without being told absolute positions. Offsets in residue index, token index and chain index are computed, clipped to ±32 (±2 for chains), one-hot encoded, concatenated and projected to the 128 pairwise channels.',
      'Clipping is what makes it generalise: any separation beyond 32 residues is simply "far", so a 199-token complex and a 2000-token one use the same buckets. Pairs in different chains, or different entities, are zeroed out entirely.',
      'This is one of only two modules in the whole pass whose output does not depend on learned weights being trained — it is a fixed function of the bookkeeping indices, projected once.',
    ],
    math: [
      { tex: 'd^{\\text{res}}_{ij} = \\mathrm{clip}(r_i - r_j,\\, -32,\\, 32) + 32 \\in \\{0, \\ldots, 64\\}' },
      { tex: 'p_{ij} = W\\left[\\,\\mathrm{onehot}(d^{\\text{res}}_{ij}) \\,\\Vert\\, \\mathrm{onehot}(d^{\\text{tok}}_{ij}) \\,\\Vert\\, \\mathrm{onehot}(d^{\\text{chain}}_{ij})\\,\\right]' },
    ],
    inputs: [{ name: 'additional_molecule_feats', symbolic: 'b n 5', concrete: [1, 199, 5] }],
    outputs: [{ name: 'relative_position_encoding', symbolic: 'b n n dpr', concrete: [1, 199, 199, 128] }],
    defines: [
      {
        name: 'relative_position_encoding',
        symbolic: 'b n n dpr',
        concrete: [1, 199, 199, 128],
        dtype: 'float32',
        description:
          'Added into pairwise_init, and also passed separately to the diffusion module so the denoiser keeps its own copy.',
      },
    ],
  },
  {
    id: 'token_bond_feats',
    stage: 'embed',
    title: 'Mark the covalent bonds',
    module: 'token_bond_to_pairwise_feat',
    traceId: 'token_bond_feats',
    summary: 'A boolean bond matrix, symmetrised, diagonal cleared, projected to 128 channels.',
    detail: [
      'Sequence adjacency is not the same as bonding, and for ligands it is not even close — GNP\'s 32 atoms form a graph, not a chain. So a separate `token_bonds` matrix marks which token pairs are covalently bonded, and it is added into the pair map.',
      'The code takes two precautions before using it: it symmetrises the matrix, and it clears the diagonal, since a token is not bonded to itself. For polymers with no explicit bond input it falls back to |i − j| = 1.',
    ],
    inputs: [{ name: 'token_bonds', symbolic: 'b n n', concrete: [1, 199, 199], dtype: 'bool' }],
    outputs: [{ name: 'token_bonds_feats', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] }],
  },
  {
    id: 'recycling',
    stage: 'embed',
    title: 'The recycling loop',
    module: 'Alphafold3.forward',
    sourceSymbol: 'Alphafold3.forward',
    repeats: '×1 here, ×4 in the paper',
    summary: 'The trunk is re-entered with its own previous output added back to the initial one.',
    detail: [
      'Everything from here to the end of the Pairformer runs inside a loop. On each pass the previous `single` and `pairwise` are normalised, projected and added back onto `single_init` and `pairwise_init` — so the trunk refines its own answer rather than starting fresh.',
      'Gradients are detached across the boundary, which is what makes recycling affordable: memory does not grow with the number of cycles. This capture uses one cycle; the paper uses four.',
    ],
    math: [
      { tex: 's \\leftarrow s^{\\text{init}} + \\mathrm{LN}_{\\text{recycle}}(s_{\\text{prev}}), \\qquad z \\leftarrow z^{\\text{init}} + \\mathrm{LN}_{\\text{recycle}}(z_{\\text{prev}})' },
    ],
    inputs: [
      { name: 'single', symbolic: 'b n ds', concrete: [1, 199, 384] },
      { name: 'pairwise', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
    ],
    outputs: [
      { name: 'single', symbolic: 'b n ds', concrete: [1, 199, 384] },
      { name: 'pairwise', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
    ],
  },
]
