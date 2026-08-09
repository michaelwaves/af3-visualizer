import type { GraphEdge, GraphNode } from '../types'
import { port, portId } from './port'

const G = 'msa_module'
const p = (name: string, side: 'in' | 'out') => portId(G, name, side)

/** Inside `MSAModule` — Algorithm 8, four blocks. */
export const msaNodes: GraphNode[] = [
  port(G, 'msa', 'b s n dmi', 'in', [1, 64, 199, 32]),
  port(G, 'single_repr', 'b n ds', 'in', [1, 199, 384]),
  port(G, 'pairwise_repr', 'b n n dp', 'in', [1, 199, 199, 128]),
  {
    id: 'msa_init_proj',
    label: 'Project alignment',
    module: 'Linear',
    kind: 'op',
    group: G,
    traceId: 'msa_init_proj',
    summary: '32 one-hot + 2 deletion features → dm = 64.',
  },
  {
    id: 'single_to_msa_feats',
    label: 'Broadcast single',
    module: 'LinearNoBias',
    kind: 'op',
    group: G,
    summary: 'The query’s token vector is added to every one of the 64 rows.',
    detail: [
      'That broadcast is what ties the alignment to the target: every row starts out knowing what the query token is, so the module can spend its capacity on how the homologs *differ*.',
    ],
  },
  {
    id: 'outer_product_mean',
    label: 'Outer product mean',
    module: 'OuterProductMean',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 9',
    sourceSymbol: 'OuterProductMean.forward',
    traceId: 'outer_product_mean',
    summary: 'The coevolution detector: alignment → pair map.',
    detail: [
      'Project each column to 32 hidden channels, take the outer product per alignment row, average over rows. That is 32 × 32 = 1024 numbers per pair, flattened and projected to the 128 pairwise channels.',
      'If two columns mutate together their outer product has consistent structure and survives the averaging. If they vary independently it averages toward zero. The pair map is being told which residues move together.',
    ],
  },
  {
    id: 'msa_pair_weighted_averaging',
    label: 'Pair-weighted averaging',
    module: 'MSAPairWeightedAveraging',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 10',
    sourceSymbol: 'MSAPairWeightedAveraging.forward',
    traceId: 'msa_pair_weighted_averaging',
    summary: 'The return path: pair map → alignment.',
    detail: [
      'Each row is mixed along its length, but the mixing weights come from a softmax over the pair map rather than from the row itself. Geometry decides which positions inform which.',
      'A sigmoid gate computed from the MSA then decides how much of that mixture to let through. It is attention with the query and key halves replaced by something the trunk already knows.',
    ],
  },
  {
    id: 'msa_transition',
    label: 'MSA transition',
    module: 'Transition',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 11',
    sourceSymbol: 'Transition.forward',
    traceId: 'msa_transition',
    summary: 'SwiGLU feed-forward with a 4× expansion, per MSA cell.',
  },
  {
    id: 'msa_pairwise_block',
    label: 'Pairwise block',
    module: 'PairwiseBlock',
    kind: 'group',
    group: G,
    sourceSymbol: 'PairwiseBlock.forward',
    traceId: 'msa_pairwise_block',
    summary: 'Triangle updates on the pair map, closing each of the four blocks.',
  },
  {
    id: 'msa_layerscale',
    label: 'LayerScale gate',
    module: 'layerscale_output',
    kind: 'op',
    group: G,
    traceId: 'msa_pairwise_final',
    summary: 'Zero-initialised, exactly as in the template branch.',
    detail: [
      '`MSAModule` ends in `layerscale_output`, an `nn.Parameter` of zeros, so its measured output at initialisation is exactly zero.',
      'The activation recorded here is the last pairwise block before the gate — the pair map the branch actually produced, running at roughly ±8.',
    ],
  },
  port(G, 'embedded_msa', 'b n n dp', 'out', [1, 199, 199, 128]),
]

export const msaEdges: GraphEdge[] = [
  { from: p('msa', 'in'), to: 'msa_init_proj', tensor: 'msa', symbolic: 'b s n (dmi+dmf)', concrete: [1, 64, 199, 34] },
  { from: p('single_repr', 'in'), to: 'single_to_msa_feats', tensor: 'single_repr', symbolic: 'b n ds' },
  { from: 'msa_init_proj', to: 'outer_product_mean', tensor: 'msa', symbolic: 'b s n dm', concrete: [1, 64, 199, 64] },
  { from: 'single_to_msa_feats', to: 'outer_product_mean', tensor: 'msa', symbolic: 'b s n dm', concrete: [1, 64, 199, 64] },
  { from: 'outer_product_mean', to: 'msa_pair_weighted_averaging', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: p('pairwise_repr', 'in'), to: 'outer_product_mean', tensor: 'pairwise_repr', symbolic: 'b n n dp' },
  { from: 'msa_init_proj', to: 'msa_pair_weighted_averaging', tensor: 'msa', symbolic: 'b s n dm', concrete: [1, 64, 199, 64] },
  { from: 'msa_pair_weighted_averaging', to: 'msa_transition', tensor: 'msa', symbolic: 'b s n dm', concrete: [1, 64, 199, 64] },
  { from: 'outer_product_mean', to: 'msa_pairwise_block', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'msa_pairwise_block', to: 'msa_layerscale', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'msa_transition', to: 'outer_product_mean', tensor: 'msa (next block)', symbolic: 'b s n dm', loop: true },
  { from: 'msa_layerscale', to: p('embedded_msa', 'out'), tensor: 'embedded_msa', symbolic: 'b n n dp' },
]
