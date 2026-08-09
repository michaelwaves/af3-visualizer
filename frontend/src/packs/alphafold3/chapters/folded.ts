import type { Chapter } from '@engine/types'

/** The one chapter that shows a structure a *trained* model produced. */
export const foldedChapters: Chapter[] = [
  {
    id: 'folded',
    stage: 'confidence',
    title: 'What it looks like trained',
    blurb: 'The same input through Boltz-2, an open-weight model of the same family.',
    section: 'Outputs',
    scene: 'folded',
    beats: [
      {
        id: 'why',
        text: 'Everything so far ran on randomly initialised weights, because this repository has none — it is an implementation, never trained to convergence, and AlphaFold 3\'s own weights are request-only and cannot be redistributed. So the architecture is real and the fold is not.',
        camera: { position: [0.5, 0, 22], target: [0.5, 0, 0] },
      },
      {
        id: 'boltz',
        text: 'To close that gap: the same input — the same sequence, the same SMILES string, the same magnesium, the same 15,953-sequence alignment — pushed through *Boltz-2*, an open-weight AlphaFold 3-class model. Different codebase, same problem, same input format.',
        highlight: ['folded'],
      },
      {
        id: 'tokens',
        text: 'It resolves to *199 tokens and 1,354 atoms* — the identical decomposition the featuriser in this repository produced. The token grid is not an implementation detail of one codebase; it is what the architecture is.',
        highlight: ['folded'],
      },
      {
        id: 'confidence',
        text: 'Coloured by pLDDT: dark blue above 90, and this is almost entirely dark blue. Per part: protein *94.9*, ligand *96.1*, the lone magnesium *89.3* — the ion is the least certain atom, which is what you would expect of a single point with no covalent neighbours.',
        drive: ['confidence'],
        highlight: ['folded'],
      },
      {
        id: 'crystal',
        text: 'And against the crystal structure it never saw: *0.75 Å* CA RMSD over all 166 residues, after rigid alignment. That is well inside the resolution of the experiment it is being compared to.',
        camera: { position: [-2, 0, 24], target: [-2, 0, 0] },
        drive: ['confidence', 'crystal'],
        highlight: ['crystal'],
      },
      {
        id: 'pae',
        text: 'Read the PAE by blocks. Protein against protein averages *1.8 Å*; protein against ligand averages *1.7 Å* — it is fractionally *more* certain about where the drug sits relative to the fold than about the fold itself. The pale square is the ligand against itself, at 4.2 Å: its internal geometry is the least settled thing in the prediction.',
        camera: { position: [2.5, 0, 25], target: [2.5, 0, 0] },
        drive: ['confidence', 'crystal', 'pae'],
        highlight: ['pae'],
      },
      {
        id: 'honesty',
        text: 'One caveat worth keeping: 721P has been in the PDB since 1990, so it is training data for every model of this generation. Take the 0.75 Å as a demonstration that the pipeline runs end to end, not as a blind benchmark.',
        drive: ['confidence', 'crystal', 'pae'],
      },
    ],
  },
]
