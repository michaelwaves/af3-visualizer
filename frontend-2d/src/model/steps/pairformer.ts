import type { Step } from '../types'

/** The Pairformer: 48 blocks, 159 M parameters, the bulk of the trunk. */
export const pairformerSteps: Step[] = [
  {
    id: 'pairformer_block',
    stage: 'trunk',
    title: 'One Pairformer block',
    module: 'PairwiseBlock',
    sourceSymbol: 'PairwiseBlock.forward',
    traceId: 'pairformer_block',
    repeats: '×48 blocks',
    summary: 'Five pairwise sub-layers, then the single stream is updated from the pair map.',
    detail: [
      'The block that does most of the work. In order: triangle multiplication outgoing, triangle multiplication incoming, triangle attention around the starting node, triangle attention around the ending node, and a pairwise transition. Each is a residual branch.',
      'Then the single stream reads from the finished pair map through attention-pair-bias, and passes through its own transition. Forty-eight of these stacked account for 159 M of the trunk\'s parameters.',
      'The unifying idea is the triangle inequality. A distance between i and j is constrained by the distances from i and j to every third token k. All four triangle operations are ways of letting k vote on the pair (i, j) — which is how a network with no explicit geometry learns to be geometrically consistent.',
    ],
    inputs: [
      { name: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
      { name: 'mask', symbolic: 'b n', concrete: [1, 199], dtype: 'bool' },
    ],
    outputs: [{ name: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] }],
  },
  {
    id: 'tri_mult_outgoing',
    stage: 'trunk',
    title: 'Triangle multiplication, outgoing edges',
    module: 'TriangleMultiplication',
    algorithm: 'Algorithm 12',
    sourceSymbol: 'TriangleMultiplication.forward',
    traceId: 'tri_mult_outgoing',
    summary: 'Pair (i, j) is updated from the edges that leave i and leave j.',
    detail: [
      'Project the pair map into a left and a right half through a GLU, then contract them over the third index. For the outgoing variant the contraction is `i k, j k → i j`: both edges point away from i and from j toward a shared k.',
      'A sigmoid gate computed from the input decides how much of the result to keep. There is no attention here and no softmax — it is a bilinear mixing over the token axis, and it is cheap relative to the attention variants.',
    ],
    math: [
      { tex: '(a_{ik}, b_{ik}) = \\mathrm{GLU}(W\\,\\mathrm{LN}(z_{ik}))' },
      { tex: 'o_{ij} = \\sum_{k} a_{ik} \\odot b_{jk}, \\qquad z_{ij} \\mathrel{+}= \\sigma(W_g z_{ij}) \\odot W_o\\,\\mathrm{LN}(o_{ij})' },
    ],
    inputs: [{ name: 'x', symbolic: 'b n n d', concrete: [1, 199, 199, 128] }],
    outputs: [{ name: 'out', symbolic: 'b n n d', concrete: [1, 199, 199, 128] }],
  },
  {
    id: 'tri_mult_incoming',
    stage: 'trunk',
    title: 'Triangle multiplication, incoming edges',
    module: 'TriangleMultiplication',
    algorithm: 'Algorithm 13',
    sourceSymbol: 'TriangleMultiplication.forward',
    traceId: 'tri_mult_incoming',
    summary: 'The same operation with the contraction reversed: edges arriving at i and at j.',
    detail: [
      'Identical code, one string changed. The einsum equation becomes `k j, k i → i j`, so the shared token k is now the source of both edges rather than their target.',
      'Running both directions matters because the pair map is not symmetric — z_ij and z_ji are separate 128-vectors, and the two multiplications propagate information in opposite directions around the triangle.',
    ],
    math: [{ tex: 'o_{ij} = \\sum_{k} a_{kj} \\odot b_{ki}' }],
    inputs: [{ name: 'x', symbolic: 'b n n d', concrete: [1, 199, 199, 128] }],
    outputs: [{ name: 'out', symbolic: 'b n n d', concrete: [1, 199, 199, 128] }],
  },
]
