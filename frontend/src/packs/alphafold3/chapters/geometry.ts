import type { Chapter } from '@engine/types'

export const geometryChapters: Chapter[] = [
  {
    id: 'templates',
    stage: 'templates',
    title: 'Templates',
    blurb: 'Algorithm 16 — borrowing a structure that already exists.',
    section: 'Trunk',
    scene: 'templates',
    beats: [
      {
        id: 'idea',
        text: 'If a related protein has already been solved, its geometry is evidence. Templates are how that evidence enters — not as coordinates, but as a *binned distance map*.',
        camera: { position: [0.6, 14, 24], target: [0.6, 0, 0] },
        highlight: ['template'],
      },
      {
        id: 'binning',
        text: 'Distances between template residues are discretised into 39 bins from 3.25 Å to 50.75 Å. Discretising costs precision and buys robustness: a template that is roughly right stays useful.',
        highlight: ['template'],
        shape: { name: 'template_distogram', dims: ['n', 'n', '39'], sizes: [166, 166, 39] },
      },
      {
        id: 'features',
        text: 'Alongside the distogram: a unit vector in residue i\'s local frame, two masks for whether the backbone and β-carbon were actually resolved, and both residues\' identities. 108 numbers per pair in total.',
        highlight: ['features'],
        drive: ['features'],
        shape: { name: 'templates', dims: ['b', 't', 'n', 'n', 'dt'] },
      },
      {
        id: 'comparison',
        text: 'The template here is the AlphaFold DB model of H-Ras — an independent prediction of the same protein. Against the crystal structure its distances are off by *0.39 Å on average*. That is how much signal a good template carries.',
        drive: ['features', 'compare'],
        highlight: ['comparison'],
      },
      {
        id: 'cheap',
        text: 'The template embedder is deliberately small: 2 pairwise blocks, 338K parameters, and its output is scaled by a learned gate initialised at zero. Templates nudge; they do not dictate.',
        drive: ['features', 'compare'],
      },
    ],
  },
  {
    id: 'triangles',
    stage: 'pairformer',
    title: 'Triangles',
    blurb: 'Algorithms 12–15 — teaching a matrix that distances obey geometry.',
    section: 'Trunk',
    scene: 'triangles',
    beats: [
      {
        id: 'constraint',
        text: 'The pair representation is a 199 × 199 grid of guesses. Left alone, nothing stops it believing i is near j, j is near k, and i is far from k — which no arrangement of points in space can satisfy.',
        camera: { position: [-1, 11, 23], target: [-1, 0, 0.5] },
        highlight: ['triangle'],
      },
      {
        id: 'inequality',
        text: 'That is the *triangle inequality*, and enforcing it is the single most important inductive bias in the architecture. Every update to the pair representation is routed through a third token k.',
        highlight: ['triangle'],
        drive: ['triangle'],
      },
      {
        id: 'multiplication',
        text: '*Triangle multiplication* does it multiplicatively: edge (i,j) is updated from the product of edges (i,k) and (j,k), summed over all k. Outgoing edges, then incoming — both directions of the triangle.',
        drive: ['triangle', 'multiply'],
        highlight: ['multiply'],
        shape: { name: 'tri_mult', dims: ['b', 'n', 'n', 'dp'] },
      },
      {
        id: 'attention',
        text: '*Triangle attention* does it with attention: each row of the matrix attends along itself, biased by the pair values at the third vertex. Starting node, then ending node — again both orientations.',
        drive: ['triangle', 'multiply', 'attend'],
        highlight: ['attend'],
      },
      {
        id: 'cost',
        text: 'This is what makes the trunk expensive. Triangle operations are cubic in sequence length — the sum over k is a full pass over the token set for every pair.',
        drive: ['triangle', 'multiply', 'attend'],
      },
      {
        id: 'result',
        text: 'The payoff is a pair representation that can be read as geometry. After 48 blocks of it, the distances implied by the matrix are consistent enough to build coordinates from.',
        drive: ['triangle', 'multiply', 'attend'],
      },
    ],
  },
  {
    id: 'pairformer',
    stage: 'pairformer',
    title: 'Pairformer',
    blurb: 'Algorithm 17 — 48 blocks, 159 million parameters.',
    section: 'Trunk',
    scene: 'pairformer',
    beats: [
      {
        id: 'stack',
        text: 'The Pairformer is the trunk: 48 identical blocks, each running the four triangle operations on the pair representation, then letting the single representation attend over itself.',
        camera: { position: [13, 4, 25], target: [1.5, 1, 0] },
        highlight: ['stack'],
      },
      {
        id: 'pair-bias',
        text: 'That attention is *biased by the pair representation*: pairwise values are projected to one scalar per head and added straight to the attention logits. Geometry steering sequence.',
        highlight: ['bias'],
        drive: ['bias'],
        shape: { name: 'attn_bias', dims: ['b', 'h', 'n', 'n'] },
      },
      {
        id: 'asymmetry',
        text: 'Note the asymmetry with AlphaFold 2. The MSA no longer flows through the trunk at all — it has already deposited what it knows. From here on the pair representation carries the reasoning alone.',
        drive: ['bias'],
      },
      {
        id: 'weight',
        text: 'At 159,240,192 parameters the Pairformer is a third of the whole model, and it is the part that grew relative to AlphaFold 2\'s Evoformer.',
        drive: ['bias'],
        shape: { name: 'pairformer', dims: ['blocks'], sizes: [48], note: '159,240,192 parameters, measured' },
      },
      {
        id: 'recycle',
        text: 'The whole trunk then runs again. *Recycling* feeds the final single and pair representations back into the start, detached from the gradient, so the model can revise its own conclusions.',
        drive: ['bias', 'recycle'],
        highlight: ['recycle'],
      },
    ],
  },
]
