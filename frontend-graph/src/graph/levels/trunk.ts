import type { GraphEdge, GraphNode } from '../types'
import { port, portId } from './port'

const G = 'trunk'
const p = (name: string, side: 'in' | 'out') => portId(G, name, side)

/** Inside the recycling loop: templates, alignment, then 48 Pairformer blocks. */
export const trunkNodes: GraphNode[] = [
  port(G, 'single_init', 'b n ds', 'in', [1, 199, 384]),
  port(G, 'pairwise_init', 'b n n dp', 'in', [1, 199, 199, 128]),
  port(G, 'msa', 'b s n dmi', 'in', [1, 64, 199, 32]),
  port(G, 'templates', 'b t n n dt', 'in', [1, 1, 199, 199, 108]),
  {
    id: 'recycle',
    label: 'Recycle',
    module: 'recycle_single / recycle_pairwise',
    kind: 'op',
    group: G,
    sourceSymbol: 'Alphafold3.forward',
    summary: 'Adds the previous cycle’s output back onto the initial representations.',
    detail: [
      'Both streams are normalised, projected and added onto `single_init` and `pairwise_init`, so the trunk refines its own answer rather than starting fresh.',
      'Gradients are detached across the boundary, which is what makes recycling affordable: memory does not grow with the number of cycles. This capture uses one cycle; the paper uses four.',
    ],
  },
  {
    id: 'template_embedder',
    label: 'Template embedder',
    module: 'TemplateEmbedder',
    kind: 'group',
    group: G,
    algorithm: 'Algorithm 16',
    sourceSymbol: 'TemplateEmbedder.forward',
    traceId: 'template_embedder',
    summary: 'Reads the template in the context of what the trunk already believes.',
    detail: [
      'Its measured output at initialisation is *exactly* zero, every one of 5,068,928 entries — a zero-initialised LayerScale gate, not a bug. Open it to see the signal one operation earlier.',
    ],
  },
  {
    id: 'msa_module',
    label: 'MSA module',
    module: 'MSAModule',
    kind: 'group',
    group: G,
    algorithm: 'Algorithm 8',
    sourceSymbol: 'MSAModule.forward',
    traceId: 'msa_module',
    repeats: '×4 blocks',
    summary: 'Trades information between the 64 alignment rows and the pair map.',
    detail: [
      'AlphaFold 3 shrank this sharply relative to AlphaFold 2, where the Evoformer was the centre of the model. Here it is four blocks and 2.7 M parameters — under 1 % of the network.',
    ],
  },
  {
    id: 'pairformer',
    label: 'Pairformer stack',
    module: 'PairformerStack',
    kind: 'group',
    group: G,
    algorithm: 'Algorithm 17',
    sourceSymbol: 'PairformerStack.forward',
    traceId: 'pairformer_stack',
    repeats: '×48 blocks',
    summary: '159 M parameters — the bulk of the trunk.',
    detail: [
      'The measured statistics are worth reading. The single stream leaves at about ±5; the pairwise stream leaves at ±2 × 10¹⁵. Forty-eight residual blocks with untrained weights compound, and nothing has yet learned to keep the sum bounded.',
    ],
  },
  port(G, 'single', 'b n ds', 'out', [1, 199, 384]),
  port(G, 'pairwise', 'b n n dp', 'out', [1, 199, 199, 128]),
]

export const trunkEdges: GraphEdge[] = [
  { from: p('single_init', 'in'), to: 'recycle', tensor: 'single_init', symbolic: 'b n ds' },
  { from: p('pairwise_init', 'in'), to: 'recycle', tensor: 'pairwise_init', symbolic: 'b n n dp' },
  { from: 'recycle', to: 'template_embedder', tensor: 'pairwise', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: p('templates', 'in'), to: 'template_embedder', tensor: 'templates', symbolic: 'b t n n dt' },
  { from: 'template_embedder', to: 'msa_module', tensor: 'pairwise', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'recycle', to: 'msa_module', tensor: 'single', symbolic: 'b n ds', concrete: [1, 199, 384] },
  { from: p('msa', 'in'), to: 'msa_module', tensor: 'msa', symbolic: 'b s n dmi' },
  { from: 'msa_module', to: 'pairformer', tensor: 'pairwise', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
  { from: 'recycle', to: 'pairformer', tensor: 'single', symbolic: 'b n ds', concrete: [1, 199, 384] },
  { from: 'pairformer', to: p('single', 'out'), tensor: 'single', symbolic: 'b n ds' },
  { from: 'pairformer', to: p('pairwise', 'out'), tensor: 'pairwise', symbolic: 'b n n dp' },
  { from: 'pairformer', to: 'recycle', tensor: 'recycled', symbolic: 'b n ds, b n n dp', loop: true },
]
