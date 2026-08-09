import type { Chapter } from '@engine/types'

export const confidenceChapters: Chapter[] = [
  {
    id: 'confidence',
    stage: 'confidence',
    title: 'Knowing what it does not know',
    blurb: 'Algorithm 31 — four heads that grade the prediction.',
    section: 'Outputs',
    scene: 'confidence',
    beats: [
      {
        id: 'why',
        text: 'A structure prediction without a confidence estimate is unusable — you cannot tell a solved loop from an invented one. AlphaFold\'s confidence heads are as important as its coordinates.',
        camera: { position: [0, 0, 25], target: [0, 0, 0] },
      },
      {
        id: 'plddt',
        text: '*pLDDT* is per-atom: the model\'s expected local distance difference test, predicted as a distribution over 50 bins and read out as a mean. Above 90 is a reliable side chain; below 50 usually means disorder.',
        highlight: ['plddt'],
        drive: ['plddt'],
        shape: { name: 'plddt', dims: ['b', 'bins', 'm'], sizes: [1, 50, 1354] },
      },
      {
        id: 'pae',
        text: '*PAE* is per-pair: if you aligned the prediction on residue j, how far off would residue i be? 64 bins from 0.5 Å to 32 Å. Low blocks mean two regions are placed confidently *relative to each other*.',
        highlight: ['pae'],
        drive: ['plddt', 'pae'],
        shape: { name: 'pae', dims: ['b', 'bins', 'n', 'n'], sizes: [1, 64, 199, 199] },
      },
      {
        id: 'domains',
        text: 'PAE is how you read domain structure out of a prediction. Block-diagonal means rigid units; bright off-diagonal blocks mean the model is unsure how two confident pieces fit together.',
        drive: ['plddt', 'pae'],
      },
      {
        id: 'distogram',
        text: 'Separately, a *distogram head* reads the pair representation directly into 64 distance bins from 2 Å to 22 Å — the trunk\'s own opinion about geometry, independent of what the sampler drew.',
        highlight: ['distogram'],
        drive: ['plddt', 'pae', 'distogram'],
        shape: { name: 'distance', dims: ['b', 'bins', 'n', 'n'], sizes: [1, 64, 199, 199] },
      },
      {
        id: 'untrained',
        text: 'On these untrained weights pLDDT sits between 41 and 57 across all 1,354 atoms — near the uniform prior, which is exactly what an uninformed head should say.',
        drive: ['plddt', 'pae', 'distogram'],
      },
    ],
  },
  {
    id: 'overview',
    stage: 'confidence',
    title: 'The whole model',
    blurb: '456,701,750 parameters, measured on an L40.',
    section: 'Outputs',
    scene: 'overview',
    beats: [
      {
        id: 'assemble',
        text: 'Put it together. Featuriser, input embedder, MSA module, template embedder, Pairformer, diffusion module, confidence heads — every block sized by its real parameter count.',
        camera: { position: [3, 1, 27], target: [3, -0.5, 0] },
        drive: ['assemble'],
      },
      {
        id: 'distribution',
        text: 'The distribution is lopsided. The diffusion module is 61% of the weights, the Pairformer 35%, and everything else — embedding, MSA, templates, confidence — shares the remaining 4%.',
        drive: ['assemble', 'sizes'],
        highlight: ['sizes'],
      },
      {
        id: 'msa-small',
        text: 'Worth sitting with: the MSA module is 2.7M parameters, 0.6% of the model. The component that defined AlphaFold 2 is now a rounding error next to the denoiser.',
        drive: ['assemble', 'sizes'],
      },
      {
        id: 'measured',
        text: 'One forward pass over this complex — trunk, 32 diffusion steps, confidence heads — takes *6.8 seconds* and *3.0 GB* on an NVIDIA L40.',
        drive: ['assemble', 'sizes', 'measured'],
        shape: { name: 'measured', dims: ['seconds', 'GB'], sizes: [7, 3], note: '199 tokens, 1354 atoms, 1 recycling step' },
      },
      {
        id: 'end',
        text: 'That is the architecture: evolution and templates compressed into a pair matrix, triangles making it geometrically honest, and a diffusion model reading coordinates out of it.',
        camera: { position: [3.5, 1, 31], target: [3.5, -0.5, 0] },
        drive: ['assemble', 'sizes', 'measured'],
      },
    ],
  },
]
