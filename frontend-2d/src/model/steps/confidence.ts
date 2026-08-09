import type { Step } from '../types'

/** The heads that score the answer, and what finally comes back. */
export const confidenceSteps: Step[] = [
  {
    id: 'confidence_pairformer',
    stage: 'confidence',
    title: 'A second, smaller trunk',
    module: 'PairformerStack',
    algorithm: 'Algorithm 17',
    sourceSymbol: 'PairformerStack.forward',
    traceId: 'confidence_pairformer',
    repeats: '×4 blocks',
    summary: 'Four more Pairformer blocks, this time reading the sampled coordinates.',
    detail: [
      'The confidence head is not a linear probe. It runs its own four-block Pairformer over the trunk\'s representations, with one crucial addition: the predicted structure is fed back in.',
      'Cα–Cα distances from the sampled coordinates are binned and embedded, and that embedding is added to the pair map. So the head is comparing what the trunk believed against what the sampler actually produced — which is exactly the information needed to judge whether to trust it.',
      'Gradients are detached at this boundary. The confidence head is trained to predict the sampler\'s error, not to change the sampler.',
    ],
    inputs: [
      { name: 'single_repr', symbolic: 'b n ds', concrete: [1, 199, 384] },
      { name: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
      { name: 'pred_atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
    ],
    outputs: [
      { name: 'single_repr', symbolic: 'b n ds', concrete: [1, 199, 384] },
      { name: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
    ],
  },
  {
    id: 'confidence_head',
    stage: 'confidence',
    title: 'Four confidence heads',
    module: 'ConfidenceHead',
    algorithm: 'Algorithm 31',
    sourceSymbol: 'ConfidenceHead.forward',
    traceId: 'confidence_head',
    summary: 'PAE and PDE per token pair, pLDDT and resolved per atom — all as binned distributions.',
    detail: [
      'Every head predicts a distribution over bins rather than a number, and the reported score is the expectation. That is what lets the model express uncertainty about its own uncertainty.',
      'PAE, 64 bins over 0.5–32 Å: if the structure were aligned on token j, how far off would token i be? This is the map people read to decide whether two domains are reliably placed relative to each other. PDE, also 64 bins, asks the same about the distance between i and j directly.',
      'pLDDT, 50 bins over 0–100, is per atom rather than per residue — a consequence of AlphaFold 3 being atom-native. `resolved` is a 2-way head predicting whether an atom would even be observed experimentally.',
      'In this untrained capture the pLDDT values land between 41 and 57, hovering near the 50 you get from an almost-uniform distribution over the bins. That is the right answer for a network that has learned nothing: it is maximally unsure.',
    ],
    math: [
      { tex: '\\mathrm{pLDDT}_a = \\sum_{k=1}^{50} p_{a,k}\\, c_k, \\qquad c_k = 0.5 + 2k \\ \\text{(bin centres over 0–100)}' },
      { tex: '\\mathrm{PAE}_{ij} = \\sum_{k=1}^{64} p_{ij,k}\\, e_k, \\qquad e_k \\in [0.5,\\, 32]\\ \\text{Å}' },
    ],
    inputs: [
      { name: 'single_inputs_repr', symbolic: 'b n dsi', concrete: [1, 199, 417] },
      { name: 'pred_atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
      { name: 'atom_feats', symbolic: 'b m da', concrete: [1, 1354, 128] },
    ],
    outputs: [
      { name: 'pae', symbolic: 'b l n n', concrete: [1, 64, 199, 199] },
      { name: 'pde', symbolic: 'b l n n', concrete: [1, 64, 199, 199] },
      { name: 'plddt', symbolic: 'b 50 m', concrete: [1, 50, 1354] },
      { name: 'resolved', symbolic: 'b 2 m', concrete: [1, 2, 1354] },
    ],
    defines: [
      {
        name: 'confidence_logits',
        symbolic: 'ConfidenceHeadLogits',
        description: 'A NamedTuple of four logit tensors: pae, pde, plddt, resolved.',
      },
    ],
  },
  {
    id: 'distogram_head',
    stage: 'confidence',
    title: 'The distogram head',
    module: 'DistogramHead',
    sourceSymbol: 'DistogramHead.forward',
    traceId: 'distogram_head',
    summary: 'A single symmetric linear map from the pair map to 64 distance bins.',
    detail: [
      'The simplest module in the network — 8,192 parameters — and a direct descendant of AlphaFold 1. It projects the pair map to 64 bins over 2–22 Å, symmetrised as z_ij + z_ji.',
      'During training it is an auxiliary loss that forces the pair map to encode actual distances rather than an arbitrary latent. At inference it is a readable picture of what the trunk thinks the contact map looks like, independent of anything the sampler did.',
    ],
    math: [{ tex: '\\mathrm{logits}_{ij} = W\\left(z_{ij} + z_{ji}\\right) \\in \\mathbb{R}^{64}' }],
    inputs: [{ name: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] }],
    outputs: [{ name: 'logits', symbolic: 'b l n n', concrete: [1, 64, 199, 199] }],
  },
  {
    id: 'outputs',
    stage: 'confidence',
    title: 'What comes back',
    module: 'Alphafold3.forward',
    sourceSymbol: 'Alphafold3.forward',
    summary: 'Coordinates for 1354 atoms, plus four confidence tensors and a distogram.',
    detail: [
      'The call returns `sampled_atom_pos` — 1354 × 3 floats, masked to the real atoms — together with the logits, and optionally a list of Biopython structures ready to write as mmCIF.',
      'The whole pass took 5.9 seconds on one NVIDIA L40 and peaked at 2.7 GB. Of the 456,701,750 parameters, 61 % sit in the diffusion module and 35 % in the Pairformer; the MSA module that AlphaFold 2 was built around is now under 1 %.',
    ],
    inputs: [],
    outputs: [
      { name: 'sampled_atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
      { name: 'confidence_logits', symbolic: 'ConfidenceHeadLogits' },
      { name: 'distogram_logits', symbolic: 'b l n n', concrete: [1, 64, 199, 199] },
    ],
  },
]
