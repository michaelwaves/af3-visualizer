import type { Chapter } from '@engine/types'

export const embeddingChapters: Chapter[] = [
  {
    id: 'embedder',
    title: 'Input embedder',
    blurb: 'Algorithm 2 — atoms in, two representations out.',
    section: 'Inputs',
    scene: 'embedder',
    beats: [
      {
        id: 'atom-transformer',
        text: 'The raw atom features first pass through a small *atom transformer*: 3 blocks, 4 heads, working inside those 27-atom windows.',
        camera: { position: [0, 10, 21], target: [0, 0.5, 0.4] },
        highlight: ['atomTransformer'],
      },
      {
        id: 'pool',
        text: 'Its output is mean-pooled from 1,354 atoms up to 199 tokens, giving a 768-wide vector per token.',
        drive: ['pool'],
        highlight: ['pooled'],
      },
      {
        id: 'single',
        text: 'A linear map produces the *single representation* — one 384-dimensional vector per token. This is the model\'s per-residue working memory.',
        drive: ['pool', 'single'],
        highlight: ['single'],
        shape: { name: 'single', dims: ['b', 'n', 'ds'] },
      },
      {
        id: 'pair',
        text: 'An outer sum produces the *pair representation* — a 128-dimensional vector for every ordered pair of tokens. 199 × 199 × 128 numbers describing how each token relates to each other token.',
        drive: ['pool', 'single', 'pair'],
        highlight: ['pair'],
        shape: { name: 'pairwise', dims: ['b', 'n', 'n', 'dp'] },
      },
      {
        id: 'why-pair',
        text: 'The pair representation is where the geometry lives. Almost everything the trunk does is an attempt to make it *self-consistent* — and the structure module simply reads it out.',
        drive: ['pool', 'single', 'pair'],
      },
    ],
  },
  {
    id: 'relpos',
    title: 'Relative position encoding',
    blurb: 'Algorithm 3 — where a token sits, relative to every other.',
    section: 'Inputs',
    scene: 'relpos',
    beats: [
      {
        id: 'idea',
        text: 'Before any learning happens, the pair representation is seeded with a purely positional signal: how far apart two tokens are in sequence, clipped at *r_max = 32*.',
        camera: { position: [0, 13, 14], target: [0, 0, 0] },
        highlight: ['relpos'],
      },
      {
        id: 'bands',
        text: 'The diagonal bands are that clipping. Beyond 32 residues apart, every pair looks identical — the model must learn long-range contacts from evolution and geometry, not from counting.',
        highlight: ['relpos'],
      },
      {
        id: 'chains',
        text: 'Tokens in *different chains* get a separate bucket entirely, as do different copies of the same entity. That is how one encoding handles a monomer, a dimer and a protein–ligand complex.',
        highlight: ['relpos'],
        shape: {
          name: 'relative_position_encoding',
          dims: ['b', 'n', 'n', 'dp'],
          sizes: [1, 199, 199, 128],
          note: '(2·32+2) + (2·32+2) + 1 + (2·2+2) = 139 one-hot inputs → 128',
        },
      },
      {
        id: 'block',
        text: 'The bright block in the corner is the ligand and the ion: 33 tokens that share no residue index with the protein, so they fall into the "different chain" bucket together.',
        highlight: ['relpos'],
      },
    ],
  },
]
