import type { Step } from '../types'

/** The two pieces of evolutionary and structural evidence the trunk reads. */
export const evidenceSteps: Step[] = [
  {
    id: 'msa_search',
    stage: 'input',
    title: 'Fetch the alignment from ColabFold',
    module: 'MMseqs2 / ColabFold',
    summary: '15,953 homologs, found by MMseqs2 against UniRef and an environmental set.',
    detail: [
      'AlphaFold 3 still leans on coevolution, so before any tensor exists there is a search. ColabFold runs MMseqs2 over UniRef30 and an environmental database and returns an a3m: the query first, then every hit aligned to it, with insertions relative to the query written in lowercase.',
      'The alignment used here is the real one for this chain — `721p-assembly1A_protein.a3m`, 15,953 sequences over the 166 query columns, precomputed and shipped in this repository rather than re-searched at capture time. Ras is deeply conserved, which is why the search comes back with that many.',
      'Each header carries the MMseqs2 fields: accession, bit score, sequence identity, e-value, and the query and target ranges. The top hits sit above 96 % identity; the tail runs down into distant GTPases.',
    ],
    inputs: [{ name: 'sequence', symbolic: 'str[166]' }],
    outputs: [
      { name: 'a3m', symbolic: '15953 × 166', note: 'query + 15,952 homologs' },
    ],
    defines: [
      {
        name: 'a3m',
        symbolic: '15953 × 166',
        description:
          'The raw ColabFold alignment. Lowercase columns are insertions relative to the query and are stripped, becoming deletion counts instead.',
      },
    ],
  },
  {
    id: 'msa_features',
    stage: 'input',
    title: 'Encode the alignment as tensors',
    module: 'MSA featurisation',
    summary: 'Top 64 rows one-hot over 32 symbols, plus two deletion features per cell.',
    detail: [
      'The trunk does not see 15,953 rows. It sees a subsample — 64 here — one-hot encoded over a 32-symbol alphabet: 20 amino acids plus unknown, 4 RNA plus unknown, 4 DNA plus unknown, and a gap. One alphabet covers every polymer type, which is again the AlphaFold 3 uniformity trick.',
      'Two extra features ride alongside each cell: `has_deletion`, and `deletion_value`, a squashed count of the insertions that were stripped out of that column. Ligand and ion tokens have no alignment at all, so they sit at the gap symbol — that is the true feature for them, not padding.',
      'Separately, the *whole* alignment is reduced to a per-column profile, 32 wide, and concatenated onto the single representation as part of `additional_token_feats`. That way the depth of the search survives even though only 64 rows are attended over.',
    ],
    math: [
      {
        tex: '\\text{deletion\\_value} = \\frac{2}{\\pi}\\arctan\\!\\left(\\frac{d}{3}\\right)',
        caption: 'insertion count d squashed into [0, 1)',
      },
      {
        tex: '\\text{profile}_{c,a} = \\frac{1}{S}\\sum_{s=1}^{S} \\mathbb{1}\\!\\left[x_{s,c} = a\\right], \\quad S = 15{,}953',
        caption: 'per-column residue frequency over every row',
      },
    ],
    inputs: [{ name: 'a3m', symbolic: '15953 × 166' }],
    outputs: [
      { name: 'msa', symbolic: 'b s n dmi', concrete: [1, 64, 199, 32], dtype: 'float32' },
      { name: 'additional_msa_feats', symbolic: 'b s n dmf', concrete: [1, 64, 199, 2], dtype: 'float32' },
      { name: 'msa_mask', symbolic: 'b s', concrete: [1, 64], dtype: 'bool' },
      { name: 'additional_token_feats', symbolic: 'b n dtf', concrete: [1, 199, 33], dtype: 'float32' },
    ],
    defines: [
      {
        name: 'msa',
        symbolic: 'b s n dmi',
        concrete: [1, 64, 199, 32],
        dtype: 'float32',
        description: 'One-hot alignment: 64 rows × 199 tokens × 32 symbols. Real ColabFold hits.',
      },
      {
        name: 'additional_msa_feats',
        symbolic: 'b s n dmf',
        concrete: [1, 64, 199, 2],
        dtype: 'float32',
        description: 'has_deletion and deletion_value, concatenated onto each MSA cell.',
      },
      {
        name: 'additional_token_feats',
        symbolic: 'b n dtf',
        concrete: [1, 199, 33],
        dtype: 'float32',
        description: 'The 32-wide alignment profile over all 15,953 rows, plus deletion_mean, per token.',
      },
    ],
  },
  {
    id: 'template_features',
    stage: 'input',
    title: 'Encode a structural template',
    module: 'Template featurisation',
    summary: 'An independent H-Ras model becomes a 108-wide pair feature.',
    detail: [
      'A template is a structure of something similar, encoded as pairwise geometry rather than as coordinates. The one used here is the AlphaFold DB model of human H-Ras, AF-P01112-F1 — genuinely independent of the crystal structure being folded.',
      'For every token pair the featuriser writes: a 39-bin one-hot of the Cα–Cα distance over 3.25–50.75 Å, the unit vector from i to j expressed in residue i\'s own backbone frame, two masks saying whether the pseudo-β and the N–Cα–C frame are resolved, and the one-hot residue identity of both i and j. 39 + 3 + 1 + 1 + 32 + 32 = 108.',
      'Because the direction is written in a local frame, the whole feature is invariant to how the template happens to be rotated in space — the network never has to learn that invariance.',
    ],
    math: [
      {
        tex: 'R_i = \\text{GramSchmidt}(\\mathrm{N}_i, \\mathrm{C\\alpha}_i, \\mathrm{C}_i), \\qquad \\hat{u}_{ij} = R_i^{\\top}\\frac{x_j - x_i}{\\lVert x_j - x_i \\rVert}',
        caption: 'direction in the local backbone frame',
      },
      { tex: 'd_t = 108 = \\underbrace{39}_{\\text{distogram}} + \\underbrace{3}_{\\hat{u}} + \\underbrace{1 + 1}_{\\text{masks}} + \\underbrace{32 + 32}_{\\text{restype } i, j}' },
    ],
    inputs: [{ name: 'AF-P01112-F1', symbolic: 'mmCIF', note: 'AlphaFold DB model of H-Ras' }],
    outputs: [
      { name: 'templates', symbolic: 'b t n n dt', concrete: [1, 1, 199, 199, 108], dtype: 'float32' },
      { name: 'template_mask', symbolic: 'b t', concrete: [1, 1], dtype: 'bool' },
    ],
    defines: [
      {
        name: 'templates',
        symbolic: 'b t n n dt',
        concrete: [1, 1, 199, 199, 108],
        dtype: 'float32',
        description:
          'One template, 108 features per token pair. 4.3 M numbers — the largest input tensor in the pass.',
      },
    ],
  },
]
