import type { GraphEdge, GraphNode } from '../types'
import { port, portId } from './port'

const G = 'pairformer'
const p = (name: string, side: 'in' | 'out') => portId(G, name, side)

/** Inside `PairformerStack` — Algorithm 17, one of the 48 identical blocks. */
export const pairformerNodes: GraphNode[] = [
  port(G, 'single_repr', 'b n ds', 'in', [1, 199, 384]),
  port(G, 'pairwise_repr', 'b n n dp', 'in', [1, 199, 199, 128]),
  {
    id: 'pairformer_block',
    label: 'Pairwise block',
    module: 'PairwiseBlock',
    kind: 'group',
    group: G,
    sourceSymbol: 'PairwiseBlock.forward',
    traceId: 'pairformer_block',
    summary: 'Five residual sub-layers of triangle updates. Open it.',
    detail: [
      'The unifying idea is the triangle inequality. A distance between i and j is constrained by the distances from i and j to every third token k. All four triangle operations are ways of letting k vote on the pair (i, j).',
    ],
  },
  {
    id: 'single_attention_pair_bias',
    label: 'Single reads the pair map',
    module: 'AttentionPairBias',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 24',
    sourceSymbol: 'AttentionPairBias.forward',
    traceId: 'single_attention_pair_bias',
    summary: 'Self-attention over 199 tokens, biased by the finished pair map.',
    detail: [
      'The only place in the block where the single stream changes. Information flows one way: the pair map informs the single stream, not the reverse.',
      'This block also carries a value residual — attention values from the first block are mixed into every later block, keeping a path back to the un-refined representation across all 48 layers.',
    ],
  },
  {
    id: 'single_transition',
    label: 'Single transition',
    module: 'Transition',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 11',
    sourceSymbol: 'Transition.forward',
    traceId: 'single_transition',
    summary: '384 → 1536 → 384, per token.',
  },
  port(G, 'single', 'b n ds', 'out', [1, 199, 384]),
  port(G, 'pairwise', 'b n n dp', 'out', [1, 199, 199, 128]),
]

export const pairformerEdges: GraphEdge[] = [
  { from: p('pairwise_repr', 'in'), to: 'pairformer_block', tensor: 'pairwise_repr', symbolic: 'b n n dp' },
  { from: p('single_repr', 'in'), to: 'single_attention_pair_bias', tensor: 'single_repr', symbolic: 'b n ds' },
  { from: 'pairformer_block', to: 'single_attention_pair_bias', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'single_attention_pair_bias', to: 'single_transition', tensor: 'single_repr', symbolic: 'b n ds', concrete: [1, 199, 384] },
  { from: 'pairformer_block', to: p('pairwise', 'out'), tensor: 'pairwise', symbolic: 'b n n dp' },
  { from: 'single_transition', to: p('single', 'out'), tensor: 'single', symbolic: 'b n ds' },
  { from: 'single_transition', to: 'pairformer_block', tensor: 'next of 48 blocks', symbolic: 'b n ds, b n n dp', loop: true },
]

const B = 'pairformer_block'
const b = (name: string, side: 'in' | 'out') => portId(B, name, side)

/** Inside `PairwiseBlock`: the four triangle operations and a transition. */
export const pairwiseBlockNodes: GraphNode[] = [
  port(B, 'pairwise_repr', 'b n n dp', 'in', [1, 199, 199, 128]),
  {
    id: 'tri_mult_outgoing',
    label: 'Triangle mult, outgoing',
    module: 'TriangleMultiplication',
    kind: 'op',
    group: B,
    algorithm: 'Algorithm 12',
    sourceSymbol: 'TriangleMultiplication.forward',
    traceId: 'tri_mult_outgoing',
    summary: 'Contract `i k, j k → i j`: edges leaving i and leaving j.',
    detail: [
      'Project the pair map into a left and right half through a GLU, contract over the third index, gate with a sigmoid of the input. No attention and no softmax — a bilinear mixing over the token axis, cheap relative to the attention variants.',
    ],
  },
  {
    id: 'tri_mult_incoming',
    label: 'Triangle mult, incoming',
    module: 'TriangleMultiplication',
    kind: 'op',
    group: B,
    algorithm: 'Algorithm 13',
    sourceSymbol: 'TriangleMultiplication.forward',
    traceId: 'tri_mult_incoming',
    summary: 'Identical code, one string changed: `k j, k i → i j`.',
    detail: [
      'Running both directions matters because the pair map is not symmetric — z_ij and z_ji are separate 128-vectors, and the two multiplications propagate information in opposite directions around the triangle.',
    ],
  },
  {
    id: 'tri_attn_starting',
    label: 'Triangle attn, starting',
    module: 'TriangleAttention',
    kind: 'op',
    group: B,
    algorithm: 'Algorithm 14',
    sourceSymbol: 'TriangleAttention.forward',
    traceId: 'tri_attn_starting',
    summary: 'Attention along each row, biased by the third edge z_jk.',
    detail: [
      'Row i of the pair map is treated as a sequence of 199 items and attention runs along it. The logit for attending from j to k carries an additive term read off z_jk — the third edge of the triangle i–j–k.',
      'The implementation packs the row index into the batch dimension, so one attention call handles all 199 rows at once.',
    ],
  },
  {
    id: 'tri_attn_ending',
    label: 'Triangle attn, ending',
    module: 'TriangleAttention',
    kind: 'op',
    group: B,
    algorithm: 'Algorithm 15',
    sourceSymbol: 'TriangleAttention.forward',
    traceId: 'tri_attn_ending',
    summary: 'The same module with `node_type="ending"` — transpose, attend, transpose back.',
  },
  {
    id: 'pairwise_transition',
    label: 'Pairwise transition',
    module: 'Transition',
    kind: 'op',
    group: B,
    algorithm: 'Algorithm 11',
    sourceSymbol: 'Transition.forward',
    traceId: 'pairwise_transition',
    summary: 'SwiGLU over all 39,601 pairs: 128 → 512 → 128.',
  },
  port(B, 'pairwise', 'b n n dp', 'out', [1, 199, 199, 128]),
]

const chain = ['tri_mult_outgoing', 'tri_mult_incoming', 'tri_attn_starting', 'tri_attn_ending', 'pairwise_transition']

export const pairwiseBlockEdges: GraphEdge[] = [
  { from: b('pairwise_repr', 'in'), to: chain[0], tensor: 'pairwise_repr', symbolic: 'b n n dp' },
  ...chain.slice(0, -1).map((from, index) => ({
    from,
    to: chain[index + 1],
    tensor: 'pairwise_repr',
    symbolic: 'b n n dp',
    concrete: [1, 199, 199, 128],
  })),
  { from: chain.at(-1)!, to: b('pairwise', 'out'), tensor: 'pairwise', symbolic: 'b n n dp' },
]
