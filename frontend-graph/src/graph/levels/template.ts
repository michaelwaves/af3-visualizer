import type { GraphEdge, GraphNode } from '../types'
import { port, portId } from './port'

const T = 'template_embedder'
const t = (name: string, side: 'in' | 'out') => portId(T, name, side)

/** Inside `TemplateEmbedder` — Algorithm 16. */
export const templateNodes: GraphNode[] = [
  port(T, 'templates', 'b t n n dt', 'in', [1, 1, 199, 199, 108]),
  port(T, 'pairwise_repr', 'b n n dp', 'in', [1, 199, 199, 128]),
  {
    id: 'template_feats_to_embed_input',
    label: 'Project template',
    module: 'LinearNoBias',
    kind: 'op',
    group: T,
    summary: 'dt = 108 → 64 channels.',
  },
  {
    id: 'pairwise_to_embed_input',
    label: 'Project pair map',
    module: 'LayerNorm + LinearNoBias',
    kind: 'op',
    group: T,
    summary: 'dp = 128 → 64, so the template is read in context.',
  },
  {
    id: 'template_pairwise_block',
    label: 'Pairwise block',
    module: 'PairwiseBlock',
    kind: 'group',
    group: T,
    sourceSymbol: 'PairwiseBlock.forward',
    traceId: 'template_pairwise_block',
    repeats: '×2 blocks',
    summary: 'The same triangle machinery as the trunk, at 64 channels.',
    detail: [
      'Worth pausing on: the template branch is not a special-purpose encoder. It is literally `PairwiseBlock`, the class the Pairformer stacks 48 of.',
    ],
  },
  {
    id: 'template_mean_pool',
    label: 'Average over templates',
    module: 'masked mean',
    kind: 'op',
    group: T,
    summary: 'Sum over t, divide by the number of unmasked templates.',
  },
  {
    id: 'template_to_out',
    label: 'LayerScale gate',
    module: 'to_out × layerscale',
    kind: 'op',
    group: T,
    traceId: 'template_to_out',
    summary: 'A per-channel gain initialised to zero — the branch starts gated shut.',
    detail: [
      '`TemplateEmbedder` ends in `out * self.layerscale`, and `layerscale` is an `nn.Parameter` of zeros. At initialisation the branch contributes exactly nothing and has to earn its way open during training.',
      'The activation recorded here is taken one operation earlier, before the gate, so there is something real to look at: roughly ±1.8.',
    ],
  },
  port(T, 'embedded_template', 'b n n dp', 'out', [1, 199, 199, 128]),
]

export const templateEdges: GraphEdge[] = [
  { from: t('templates', 'in'), to: 'template_feats_to_embed_input', tensor: 'templates', symbolic: 'b t n n dt' },
  { from: t('pairwise_repr', 'in'), to: 'pairwise_to_embed_input', tensor: 'pairwise_repr', symbolic: 'b n n dp' },
  { from: 'template_feats_to_embed_input', to: 'template_pairwise_block', tensor: 'u', symbolic: 'b t n n d', concrete: [1, 1, 199, 199, 64] },
  { from: 'pairwise_to_embed_input', to: 'template_pairwise_block', tensor: 'u', symbolic: 'b n n d', concrete: [1, 199, 199, 64] },
  { from: 'template_pairwise_block', to: 'template_mean_pool', tensor: 'templates', symbolic: 'b t n n d', concrete: [1, 1, 199, 199, 64] },
  { from: 'template_mean_pool', to: 'template_to_out', tensor: 'avg_template_repr', symbolic: 'b n n d', concrete: [1, 199, 199, 64] },
  { from: 'template_to_out', to: t('embedded_template', 'out'), tensor: 'out', symbolic: 'b n n dp' },
]
