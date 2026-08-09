import type { Step } from '../types'

/** Algorithm 2 and its neighbours: atoms in, two representations out. */
export const embedSteps: Step[] = [
  {
    id: 'input_embedder',
    stage: 'embed',
    title: 'Embed the raw inputs',
    module: 'InputFeatureEmbedder',
    algorithm: 'Algorithm 2',
    sourceSymbol: 'InputFeatureEmbedder.forward',
    traceId: 'input_embedder',
    summary: 'Atoms are attended over locally, pooled to tokens, then split into two streams.',
    detail: [
      'This is where the network first touches the data. Atom features are projected to 128 channels, atom-pair features to 16, and a small three-block transformer runs over the atoms inside their 27-wide windows so that each atom knows its immediate chemical neighbourhood.',
      'Those atom features are then pooled up to the 199 tokens using `molecule_atom_lens`, giving 384 channels per token. Concatenating the 33 alignment-derived token features gives `single_inputs`, 417 wide — the tensor that will be handed, unchanged, all the way to the diffusion module and the confidence head.',
      'From `single_inputs` two things are born: `single_init` by a linear projection, and `pairwise_init` by an outer sum. Everything the trunk does from here is a refinement of those two.',
    ],
    math: [
      { tex: 'd_{\\text{single input}} = \\underbrace{384}_{\\text{dim\\_token}} + \\underbrace{33}_{\\text{profile, deletion\\_mean}} = 417' },
      { tex: '\\mathbf{s}^{\\text{init}} = W_s\\,\\mathbf{s}^{\\text{inputs}} + \\mathrm{Embed}(\\text{molecule\\_ids})' },
    ],
    inputs: [
      { name: 'atom_inputs', symbolic: 'b m dai', concrete: [1, 1354, 3] },
      { name: 'atompair_inputs', symbolic: 'b nw w (w*2) dapi', concrete: [1, 51, 27, 54, 5] },
      { name: 'molecule_atom_lens', symbolic: 'b n', concrete: [1, 199] },
      { name: 'additional_token_feats', symbolic: 'b n dtf', concrete: [1, 199, 33] },
    ],
    outputs: [
      { name: 'single_inputs', symbolic: 'b n dsi', concrete: [1, 199, 417] },
      { name: 'single_init', symbolic: 'b n ds', concrete: [1, 199, 384] },
      { name: 'pairwise_init', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
      { name: 'atom_feats', symbolic: 'b m da', concrete: [1, 1354, 128] },
      { name: 'atompair_feats', symbolic: 'b nw w (w*2) dap', concrete: [1, 51, 27, 54, 16] },
    ],
    defines: [
      {
        name: 'single_inputs',
        symbolic: 'b n dsi',
        concrete: [1, 199, 417],
        dtype: 'float32',
        description:
          'The raw per-token feature. Survives untouched to the diffusion module and the confidence head — a skip connection around the entire trunk.',
      },
      {
        name: 'single',
        symbolic: 'b n ds',
        concrete: [1, 199, 384],
        dtype: 'float32',
        description: 'The single representation: one 384-vector per token. Rebound by every trunk block.',
      },
      {
        name: 'pairwise',
        symbolic: 'b n n dp',
        concrete: [1, 199, 199, 128],
        dtype: 'float32',
        description:
          'The pairwise representation: a 128-vector for every ordered token pair. 5.07 M numbers, and the real object of interest in the trunk.',
      },
      {
        name: 'atom_feats',
        symbolic: 'b m da',
        concrete: [1, 1354, 128],
        dtype: 'float32',
        description: 'Per-atom features after local attention. Reused by the diffusion module and the confidence head.',
      },
      {
        name: 'atompair_feats',
        symbolic: 'b nw w (w*2) dap',
        concrete: [1, 51, 27, 54, 16],
        dtype: 'float32',
        description: 'Windowed atom-pair features, 16 channels. Never materialised as a full 1354 × 1354 matrix.',
      },
    ],
  },
  {
    id: 'atom_transformer',
    stage: 'embed',
    title: 'Attend over atoms, inside windows',
    module: 'DiffusionTransformer',
    algorithm: 'Algorithm 7',
    sourceSymbol: 'DiffusionTransformer.forward',
    traceId: 'atom_transformer',
    repeats: '×3 blocks',
    summary: 'Local attention only: 27 atoms per window, each seeing 54 neighbours.',
    detail: [
      'Full attention over 1354 atoms would be 1.83 M pairs, and almost all of it would be wasted — chemistry is local. So atoms are cut into 51 windows of 27, and each window attends to itself plus the window on either side: 54 keys per query.',
      'The same class, `DiffusionTransformer`, is used four times in AlphaFold 3: here as the atom transformer, and later as the diffusion module\'s atom encoder, token transformer and atom decoder. Only the widths and the window size change.',
    ],
    math: [
      { tex: '\\text{cost} \\;=\\; n_w \\cdot w \\cdot 2w \\;=\\; 51 \\cdot 27 \\cdot 54 \\;=\\; 74{,}358 \\ \\text{pairs}' },
      { tex: '\\text{versus } m^2 = 1354^2 = 1{,}833{,}316 \\ \\text{pairs for full attention}' },
    ],
    inputs: [
      { name: 'noised_repr', symbolic: 'b m da', concrete: [1, 1354, 128] },
      { name: 'single_repr', symbolic: 'b m da', concrete: [1, 1354, 128] },
      { name: 'pairwise_repr', symbolic: 'b nw w (w*2) dap', concrete: [1, 51, 27, 54, 16] },
    ],
    outputs: [{ name: 'atom_feats', symbolic: 'b m da', concrete: [1, 1354, 128] }],
  },
  {
    id: 'atom_attention_pair_bias',
    stage: 'embed',
    title: 'Attention with a pair bias',
    module: 'AttentionPairBias',
    algorithm: 'Algorithm 24',
    sourceSymbol: 'AttentionPairBias.forward',
    traceId: 'atom_attention_pair_bias',
    summary: 'The pairwise stream is projected to a scalar per pair and added to the attention logits.',
    detail: [
      'This is the join between the two streams, and it is the single most important idea in the architecture. Attention normally scores a query against a key and nothing else. Here a learned projection of the pairwise representation is added to that score before the softmax.',
      'So the pair map does not merely sit beside the sequence — it steers what every token is allowed to look at. Anything the trunk learns about the geometry of i and j immediately becomes a bias on attention between them.',
    ],
    math: [
      {
        tex: 'a_{ij} = \\mathrm{softmax}_j\\!\\left( \\frac{q_i^{\\top} k_j}{\\sqrt{d}} + \\underbrace{b_{ij}}_{W_b\\,\\mathrm{LN}(z_{ij})} \\right)',
        caption: 'the pair bias enters before the softmax',
      },
    ],
    inputs: [
      { name: 'single_repr', symbolic: 'b n ds', concrete: [1, 1354, 128] },
      { name: 'pairwise_repr', symbolic: 'b nw w (w*2) dp', concrete: [1, 51, 27, 54, 16] },
    ],
    outputs: [{ name: 'out', symbolic: 'b n ds', concrete: [1, 1354, 128] }],
  },
]
