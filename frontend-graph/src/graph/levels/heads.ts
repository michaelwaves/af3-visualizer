import type { GraphEdge, GraphNode } from '../types'
import { port, portId } from './port'

const G = 'confidence_head'
const p = (name: string, side: 'in' | 'out') => portId(G, name, side)

/** Inside `ConfidenceHead` — Algorithm 31. */
export const headNodes: GraphNode[] = [
  port(G, 'single_repr', 'b n ds', 'in', [1, 199, 384]),
  port(G, 'single_inputs_repr', 'b n dsi', 'in', [1, 199, 417]),
  port(G, 'pairwise_repr', 'b n n dp', 'in', [1, 199, 199, 128]),
  port(G, 'pred_atom_pos', 'b m 3', 'in', [1, 1354, 3]),
  {
    id: 'dist_bin_pairwise_embed',
    label: 'Embed predicted distances',
    module: 'Embedding',
    kind: 'op',
    group: G,
    summary: 'Cα–Cα distances from the sampled structure, binned and embedded.',
    detail: [
      'This is what makes the head more than a probe: it compares what the trunk believed against what the sampler actually produced, which is exactly the information needed to judge whether to trust it.',
    ],
  },
  {
    id: 'single_inputs_to_pairwise',
    label: 'Raw inputs → pairs',
    module: 'LinearNoBiasThenOuterSum',
    kind: 'op',
    group: G,
    sourceSymbol: 'LinearNoBiasThenOuterSum.forward',
    summary: 'The 417-wide raw feature, outer-summed into the pair map again.',
  },
  {
    id: 'confidence_pairformer',
    label: 'Confidence Pairformer',
    module: 'PairformerStack',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 17',
    sourceSymbol: 'PairformerStack.forward',
    traceId: 'confidence_pairformer',
    repeats: '×4 blocks',
    summary: 'A second, smaller trunk over the detached representations.',
    detail: [
      'Gradients are detached at this boundary. The confidence head is trained to predict the sampler’s error, not to change the sampler.',
    ],
  },
  {
    id: 'to_pae_logits',
    label: 'PAE',
    module: 'to_pae_logits',
    kind: 'op',
    group: G,
    summary: '64 bins over 0.5–32 Å, per token pair.',
    detail: [
      'If the structure were aligned on token j, how far off would token i be? This is the map people read to decide whether two domains are reliably placed relative to each other.',
    ],
  },
  {
    id: 'to_pde_logits',
    label: 'PDE',
    module: 'to_pde_logits',
    kind: 'op',
    group: G,
    summary: '64 bins, per token pair — the error on the distance itself.',
  },
  {
    id: 'to_plddt_logits',
    label: 'pLDDT',
    module: 'to_plddt_logits',
    kind: 'op',
    group: G,
    summary: '50 bins over 0–100, per atom.',
    detail: [
      'Per atom rather than per residue, a consequence of AlphaFold 3 being atom-native. In this untrained capture the values land between 41 and 57 — near the 50 an almost-uniform distribution over the bins gives, which is the right answer for a network that has learned nothing.',
    ],
  },
  {
    id: 'to_resolved_logits',
    label: 'Resolved',
    module: 'to_resolved_logits',
    kind: 'op',
    group: G,
    summary: 'A 2-way head: would this atom be observed experimentally?',
  },
  port(G, 'pae', 'b l n n', 'out', [1, 64, 199, 199]),
  port(G, 'pde', 'b l n n', 'out', [1, 64, 199, 199]),
  port(G, 'plddt', 'b 50 m', 'out', [1, 50, 1354]),
  port(G, 'resolved', 'b 2 m', 'out', [1, 2, 1354]),
]

export const headEdges: GraphEdge[] = [
  { from: p('pred_atom_pos', 'in'), to: 'dist_bin_pairwise_embed', tensor: 'pred_atom_pos', symbolic: 'b m 3' },
  { from: p('single_inputs_repr', 'in'), to: 'single_inputs_to_pairwise', tensor: 'single_inputs_repr', symbolic: 'b n dsi' },
  { from: 'dist_bin_pairwise_embed', to: 'confidence_pairformer', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'single_inputs_to_pairwise', to: 'confidence_pairformer', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: p('pairwise_repr', 'in'), to: 'confidence_pairformer', tensor: 'pairwise_repr', symbolic: 'b n n dp' },
  { from: p('single_repr', 'in'), to: 'confidence_pairformer', tensor: 'single_repr', symbolic: 'b n ds' },
  { from: 'confidence_pairformer', to: 'to_pae_logits', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'confidence_pairformer', to: 'to_pde_logits', tensor: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'confidence_pairformer', to: 'to_plddt_logits', tensor: 'single_repr', symbolic: 'b n ds', concrete: [1, 199, 384] },
  { from: 'confidence_pairformer', to: 'to_resolved_logits', tensor: 'single_repr', symbolic: 'b n ds', concrete: [1, 199, 384] },
  { from: 'to_pae_logits', to: p('pae', 'out'), tensor: 'pae', symbolic: 'b l n n' },
  { from: 'to_pde_logits', to: p('pde', 'out'), tensor: 'pde', symbolic: 'b l n n' },
  { from: 'to_plddt_logits', to: p('plddt', 'out'), tensor: 'plddt', symbolic: 'b 50 m' },
  { from: 'to_resolved_logits', to: p('resolved', 'out'), tensor: 'resolved', symbolic: 'b 2 m' },
]
