import type { Chapter } from '@engine/types'

export const evolutionChapters: Chapter[] = [
  {
    id: 'msa',
    stage: 'msa',
    title: 'Fifteen thousand relatives',
    blurb: 'Evolution as a measuring instrument.',
    section: 'Trunk',
    scene: 'msa',
    beats: [
      {
        id: 'why',
        text: 'Nothing in the sequence alone says which residues touch. But evolution has been running the experiment for a billion years: if two positions are in contact, a mutation at one tends to be compensated at the other.',
        camera: { position: [0.9, -0.3, 17], target: [0.9, -0.3, 0] },
      },
      {
        id: 'search',
        text: 'So the first thing AlphaFold does is search genetic databases for homologues and stack them into a *multiple sequence alignment*. This one ships with the repository: 15,953 sequences, 166 columns wide.',
        drive: ['rows'],
        highlight: ['msa'],
        shape: { name: 'msa', dims: ['b', 's', 'n', 'dm'], sizes: [1, 15953, 166, 32] },
      },
      {
        id: 'species',
        text: 'Each row is a real organism carrying its own copy of Ras. The icons are resolved from UniProt: human, fish, nematode, fungus, butterfly, truffle. The protein is old enough that all of them still share it.',
        drive: ['rows'],
        highlight: ['msa'],
      },
      {
        id: 'identity',
        text: 'The rows are sorted by identity to the target. Near the top, sequences almost identical to human Ras; near the bottom, homologues that agree at barely 40% of positions but still fold the same way.',
        drive: ['rows'],
      },
      {
        id: 'conservation',
        text: 'Read the alignment down a column instead of across a row and you get *conservation*. The nucleotide-binding loops barely move across the whole tree of life; surface loops drift freely.',
        drive: ['rows', 'conservation'],
        highlight: ['conservation'],
      },
      {
        id: 'gaps',
        text: 'Gaps matter too. AlphaFold 3 feeds the model two extra numbers per alignment cell — whether a deletion occurred, and how large — because insertion patterns mark loop boundaries.',
        drive: ['rows', 'conservation', 'gaps'],
        highlight: ['gaps'],
        shape: { name: 'additional_msa_feats', dims: ['b', 's', 'n', '2'], sizes: [1, 64, 199, 2] },
      },
      {
        id: 'subsample',
        text: 'The trunk does not see all 15,953. Each recycling pass *subsamples* a few hundred rows without replacement, so the model never overfits one particular slice of the alignment.',
        drive: ['rows', 'conservation', 'gaps'],
      },
      {
        id: 'demoted',
        text: 'One of the quieter changes from AlphaFold 2: the MSA stack shrank from 48 blocks to *4*, and 2.7M parameters. Evolution still matters, but the pair representation now does most of the reasoning.',
        drive: ['rows', 'conservation', 'gaps'],
      },
    ],
  },
  {
    id: 'msa-pair',
    stage: 'msa',
    title: 'How the alignment talks to the pair',
    blurb: 'Algorithms 9 and 10 — a two-way channel.',
    section: 'Trunk',
    scene: 'msaPair',
    beats: [
      {
        id: 'outer-product',
        text: 'The alignment reaches the pair representation through the *outer product mean*. For every pair of columns i and j, take each sequence\'s pair of 32-wide projections, multiply them into a 32 × 32 outer product, and average over sequences.',
        camera: { position: [0, 0, 21], target: [0, 0, 0] },
        highlight: ['opm'],
        shape: { name: 'outer_product_mean', dims: ['b', 'n', 'n', 'dp'] },
      },
      {
        id: 'coevolution',
        text: 'That average is precisely a coevolution statistic. If columns i and j vary together across the alignment, their outer product has structure; if they vary independently, it averages toward nothing.',
        highlight: ['opm'],
      },
      {
        id: 'back',
        text: 'The channel runs the other way too. *MSA pair-weighted averaging* turns the pair representation into an attention weight over columns, then uses it to mix information along each alignment row.',
        highlight: ['pwa'],
        drive: ['back'],
        shape: { name: 'msa_pair_weighted_averaging', dims: ['b', 's', 'n', 'dm'], sizes: [1, 64, 199, 64] },
      },
      {
        id: 'loop',
        text: 'Alignment informs geometry; geometry re-reads the alignment. Four rounds of that, and the MSA has handed over what it knows.',
        drive: ['back'],
      },
    ],
  },
]
