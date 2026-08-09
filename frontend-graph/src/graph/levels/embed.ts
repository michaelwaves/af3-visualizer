import type { GraphEdge, GraphNode } from '../types'
import { port, portId } from './port'

const G = 'input_embedder'
const p = (name: string, side: 'in' | 'out') => portId(G, name, side)

/** Inside `InputFeatureEmbedder` — Algorithm 2. */
export const embedNodes: GraphNode[] = [
  port(G, 'atom_inputs', 'b m dai', 'in', [1, 1354, 3]),
  port(G, 'atompair_inputs', 'b nw w (w*2) dapi', 'in', [1, 51, 27, 54, 5]),
  port(G, 'molecule_atom_lens', 'b n', 'in', [1, 199]),
  port(G, 'additional_token_feats', 'b n dtf', 'in', [1, 199, 33]),
  {
    id: 'to_atom_feats',
    label: 'Project atoms',
    module: 'LinearNoBias',
    kind: 'op',
    group: G,
    summary: 'dai = 3 → da = 128 per atom.',
  },
  {
    id: 'to_atompair_feats',
    label: 'Project atom pairs',
    module: 'LinearNoBias',
    kind: 'op',
    group: G,
    summary: 'dapi = 5 → dap = 16, kept windowed.',
    detail: [
      'Never materialised as a full 1354 × 1354 matrix — that would be 1.83 M pairs per channel. Instead 51 windows of 27 atoms, each attending to 54 neighbours.',
    ],
  },
  {
    id: 'atompair_feats_mlp',
    label: 'Atom-pair MLP',
    module: 'Sequential',
    kind: 'op',
    group: G,
    summary: 'Three linear layers with ReLU, conditioned on the atom features.',
  },
  {
    id: 'atom_transformer',
    label: 'Atom transformer',
    module: 'DiffusionTransformer',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 7',
    sourceSymbol: 'DiffusionTransformer.forward',
    traceId: 'atom_transformer',
    repeats: '×3 blocks',
    summary: 'Windowed attention so each atom learns its chemical neighbourhood.',
    detail: [
      'Full attention over 1354 atoms would be 1.83 M pairs and almost all of it wasted — chemistry is local. Windowed costs 51 × 27 × 54 = 74,358 pairs instead.',
      'The same class is used four times in AlphaFold 3: here, and as the diffusion module’s atom encoder, token transformer and atom decoder.',
    ],
  },
  {
    id: 'atom_attention_pair_bias',
    label: 'Attention + pair bias',
    module: 'AttentionPairBias',
    kind: 'op',
    group: G,
    algorithm: 'Algorithm 24',
    sourceSymbol: 'AttentionPairBias.forward',
    traceId: 'atom_attention_pair_bias',
    summary: 'The pair stream becomes an additive bias on the attention logits.',
    detail: [
      'The single most important join in the architecture. A learned projection of the pairwise representation is added to the query·key score before the softmax, so the pair map steers what every token may look at.',
    ],
  },
  {
    id: 'atom_to_token_pool',
    label: 'Pool atoms → tokens',
    module: 'AtomToTokenPooler',
    kind: 'op',
    group: G,
    sourceSymbol: 'AtomToTokenPooler.forward',
    summary: 'Segmented mean over each token’s atoms: 1354 × 128 → 199 × 384.',
    detail: [
      'A glycine token averages 4 atoms, a tryptophan 14, a ligand-atom token exactly 1. `molecule_atom_lens` is the segmentation.',
    ],
  },
  {
    id: 'concat_single_inputs',
    label: 'Concatenate',
    module: 'cat',
    kind: 'op',
    group: G,
    summary: '384 pooled + 33 alignment-derived = dsi = 417.',
    detail: [
      '`single_inputs` is handed on unchanged to the diffusion module and the confidence head — a skip connection around the entire trunk.',
    ],
  },
  {
    id: 'single_input_to_single_init',
    label: 'Single init',
    module: 'LinearNoBias',
    kind: 'op',
    group: G,
    summary: '417 → 384, plus a learned embedding of molecule_ids.',
  },
  {
    id: 'single_input_to_pairwise_init',
    label: 'Pairwise init',
    module: 'LinearNoBiasThenOuterSum',
    kind: 'op',
    group: G,
    sourceSymbol: 'LinearNoBiasThenOuterSum.forward',
    summary: 'Outer sum over tokens: 199 × 417 → 199 × 199 × 128.',
    detail: [
      'Project each token to 128 twice, then add every row vector to every column vector. That is how a per-token tensor becomes a per-pair one without a single learned pair parameter.',
    ],
  },
  port(G, 'single_inputs', 'b n dsi', 'out', [1, 199, 417]),
  port(G, 'single_init', 'b n ds', 'out', [1, 199, 384]),
  port(G, 'pairwise_init', 'b n n dp', 'out', [1, 199, 199, 128]),
  port(G, 'atom_feats', 'b m da', 'out', [1, 1354, 128]),
  port(G, 'atompair_feats', 'b nw w (w*2) dap', 'out', [1, 51, 27, 54, 16]),
]

export const embedEdges: GraphEdge[] = [
  { from: p('atom_inputs', 'in'), to: 'to_atom_feats', tensor: 'atom_inputs', symbolic: 'b m dai' },
  { from: p('atompair_inputs', 'in'), to: 'to_atompair_feats', tensor: 'atompair_inputs', symbolic: 'b nw w (w*2) dapi' },
  { from: 'to_atom_feats', to: 'atompair_feats_mlp', tensor: 'atom_feats', symbolic: 'b m da', concrete: [1, 1354, 128] },
  { from: 'to_atompair_feats', to: 'atompair_feats_mlp', tensor: 'atompair_feats', symbolic: 'b nw w (w*2) dap' },
  { from: 'to_atom_feats', to: 'atom_transformer', tensor: 'atom_feats', symbolic: 'b m da', concrete: [1, 1354, 128] },
  { from: 'atompair_feats_mlp', to: 'atom_transformer', tensor: 'atompair_feats', symbolic: 'b nw w (w*2) dap', concrete: [1, 51, 27, 54, 16] },
  { from: 'atom_transformer', to: 'atom_attention_pair_bias', tensor: 'noised_repr', symbolic: 'b m da', concrete: [1, 1354, 128] },
  { from: 'atom_attention_pair_bias', to: 'atom_to_token_pool', tensor: 'atom_feats', symbolic: 'b m da', concrete: [1, 1354, 128] },
  { from: p('molecule_atom_lens', 'in'), to: 'atom_to_token_pool', tensor: 'molecule_atom_lens', symbolic: 'b n' },
  { from: 'atom_to_token_pool', to: 'concat_single_inputs', tensor: 'tokens', symbolic: 'b n dtok', concrete: [1, 199, 384] },
  { from: p('additional_token_feats', 'in'), to: 'concat_single_inputs', tensor: 'additional_token_feats', symbolic: 'b n dtf' },
  { from: 'concat_single_inputs', to: 'single_input_to_single_init', tensor: 'single_inputs', symbolic: 'b n dsi', concrete: [1, 199, 417] },
  { from: 'concat_single_inputs', to: 'single_input_to_pairwise_init', tensor: 'single_inputs', symbolic: 'b n dsi', concrete: [1, 199, 417] },
  { from: 'concat_single_inputs', to: p('single_inputs', 'out'), tensor: 'single_inputs', symbolic: 'b n dsi' },
  { from: 'single_input_to_single_init', to: p('single_init', 'out'), tensor: 'single_init', symbolic: 'b n ds' },
  { from: 'single_input_to_pairwise_init', to: p('pairwise_init', 'out'), tensor: 'pairwise_init', symbolic: 'b n n dp' },
  { from: 'atom_attention_pair_bias', to: p('atom_feats', 'out'), tensor: 'atom_feats', symbolic: 'b m da' },
  { from: 'atompair_feats_mlp', to: p('atompair_feats', 'out'), tensor: 'atompair_feats', symbolic: 'b nw w (w*2) dap' },
]
