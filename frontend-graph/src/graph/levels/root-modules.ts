import type { GraphNode } from '../types'

/** The learned modules at the top level, in forward-pass order. */
export const rootModuleNodes: GraphNode[] = [
  {
    id: 'input_embedder',
    label: 'Input embedder',
    module: 'InputFeatureEmbedder',
    kind: 'group',
    algorithm: 'Algorithm 2',
    sourceSymbol: 'InputFeatureEmbedder.forward',
    traceId: 'input_embedder',
    summary: 'Atoms attended locally, pooled to tokens, split into two streams.',
    detail: [
      'Where the network first touches the data. Everything the trunk refines — the single stream and the pairwise stream — is born here, out of one 417-wide per-token tensor.',
    ],
  },
  {
    id: 'relative_position_encoding',
    label: 'Relative positions',
    module: 'RelativePositionEncoding',
    kind: 'op',
    algorithm: 'Algorithm 3',
    sourceSymbol: 'RelativePositionEncoding.forward',
    traceId: 'relative_position_encoding',
    summary: 'Clipped residue, token and chain offsets, one-hot then projected.',
    detail: [
      'Offsets are clipped to ±32 (±2 for chains), so any separation beyond 32 residues is simply “far”. That is what lets one model handle a 199-token complex and a 2000-token one with the same buckets.',
      'Pairs in different chains or different entities are zeroed out entirely. The result is added into `pairwise_init`, and also handed separately to the diffusion module.',
    ],
  },
  {
    id: 'token_bond_feats',
    label: 'Token bonds',
    module: 'token_bond_to_pairwise_feat',
    kind: 'op',
    traceId: 'token_bond_feats',
    summary: 'A symmetrised bond matrix with the diagonal cleared, projected to 128.',
    detail: [
      'Sequence adjacency is not bonding, and for a ligand it is not even close — GNP’s 32 atoms form a graph, not a chain. So bonds get their own channel into the pair map.',
    ],
  },
  {
    id: 'trunk',
    label: 'Trunk',
    module: 'template + MSA + Pairformer',
    kind: 'group',
    repeats: '×1 recycling',
    summary: 'The evidence branches and 48 Pairformer blocks, run inside the recycling loop.',
    detail: [
      'Everything downstream reads two tensors from here and nothing else: the single representation and the pairwise representation.',
    ],
  },
  {
    id: 'edm',
    label: 'Diffusion sampler',
    module: 'ElucidatedAtomDiffusion',
    kind: 'group',
    algorithm: 'Algorithm 18',
    sourceSymbol: 'ElucidatedAtomDiffusion.sample',
    repeats: '×32 steps',
    summary: 'Walks Gaussian noise down 33 levels into atomic coordinates.',
    detail: [
      'AlphaFold 3 does not fold with an equivariant structure module the way AlphaFold 2 did. It generates coordinates with a diffusion model.',
    ],
  },
  {
    id: 'confidence_head',
    label: 'Confidence head',
    module: 'ConfidenceHead',
    kind: 'group',
    algorithm: 'Algorithm 31',
    sourceSymbol: 'ConfidenceHead.forward',
    traceId: 'confidence_head',
    summary: 'PAE, PDE, pLDDT and resolved — each a distribution over bins.',
    detail: [
      'Not a linear probe: it runs its own four-block Pairformer, and it is fed the sampled coordinates so it can compare what the trunk believed against what the sampler produced.',
    ],
  },
  {
    id: 'distogram_head',
    label: 'Distogram head',
    module: 'DistogramHead',
    kind: 'op',
    sourceSymbol: 'DistogramHead.forward',
    traceId: 'distogram_head',
    summary: 'A symmetric linear map from the pair map to 64 distance bins.',
    detail: [
      'The simplest module in the network — 8,192 parameters — and a direct descendant of AlphaFold 1. During training it forces the pair map to encode real distances rather than an arbitrary latent.',
    ],
  },
  {
    id: 'structure',
    label: 'Structure',
    module: 'sampled_atom_pos',
    kind: 'sink',
    summary: 'One Cartesian coordinate per heavy atom, in ångström.',
  },
  {
    id: 'confidences',
    label: 'Confidences',
    module: 'ConfidenceHeadLogits',
    kind: 'sink',
    summary: 'pae, pde, plddt, resolved, and the distogram logits.',
  },
]
