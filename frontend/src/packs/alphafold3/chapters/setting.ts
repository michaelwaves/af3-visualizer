import type { Chapter } from '@engine/types'

export const settingChapters: Chapter[] = [
  {
    id: 'complex',
    stage: 'featurise',
    title: 'From protein chains to complexes',
    blurb: 'The target: H-Ras, a GTP analogue and a magnesium ion, predicted together.',
    section: 'The problem',
    scene: 'complex',
    beats: [
      {
        id: 'target',
        text: 'This is 721p — the catalytic domain of *H-Ras*, the switch protein mutated in roughly a fifth of human cancers. Every number in this walkthrough comes from running the PyTorch model in this repository on this structure.',
        camera: { position: [10, 6, 15], target: [0, 0.4, 0] },
        highlight: ['protein'],
      },
      {
        id: 'chain',
        text: 'The protein is 166 amino acids, drawn here through its alpha carbons. AlphaFold 2 could already do this part.',
        highlight: ['protein'],
        shape: { name: 'protein chain', dims: ['residues'] },
      },
      {
        id: 'ligand',
        text: 'But Ras does nothing alone. Bound in its pocket is *GNP*, a non-hydrolysable GTP analogue — 32 heavy atoms of small molecule that AlphaFold 2 had no way to represent.',
        camera: { position: [6, 3.5, 10], target: [1.0, 0.2, 1.2] },
        drive: ['ligand'],
        highlight: ['ligand'],
      },
      {
        id: 'ion',
        text: 'And a single *magnesium ion* — one atom — which coordinates the phosphates and holds the whole switch together. Get it wrong and the pocket falls apart.',
        drive: ['ligand', 'ion'],
        highlight: ['ion'],
      },
      {
        id: 'unified',
        text: 'AlphaFold 2 took one protein sequence and returned one chain. AlphaFold 3 takes proteins, nucleic acids, ligands, ions and modified residues in a single input and places every atom in one pass. Most of what follows is the machinery that change required.',
        camera: { position: [12, 7, 17], target: [0, 0.4, 0] },
        drive: ['ligand', 'ion'],
      },
      {
        id: 'not-an-input',
        text: 'One thing to be clear about: the crystal structure is *not* an input. It is where the sequence and the list of bound molecules were read from, and it is the ground truth the prediction gets compared against. What the model receives is a sequence, a SMILES string and the word "Mg" — open *files* on the right to see exactly that.',
        drive: ['ligand', 'ion'],
      },
      {
        id: 'counts',
        text: 'Concretely: 1,321 protein atoms, 32 ligand atoms, 1 magnesium. *1,354 heavy atoms* — and the featuriser in this repository builds exactly that many from the sequence, the SMILES string and the ion name alone.',
        drive: ['ligand', 'ion'],
        shape: {
          name: 'atom_pos',
          dims: ['b', 'm', '3'],
          sizes: [1, 1354, 3],
          note: 'hydrogens excluded, as everywhere in AlphaFold 3',
        },
      },
    ],
  },
]
