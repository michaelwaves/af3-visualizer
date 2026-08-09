import type { Step } from '../types'

/** Featurisation: PDB 721p, its alignment and its template become tensors. */
export const inputSteps: Step[] = [
  {
    id: 'pdb',
    stage: 'input',
    title: 'Read the complex from the PDB',
    module: 'mmCIF',
    summary: 'PDB 721p — the H-Ras P21 catalytic domain, a GTP analogue and a magnesium ion.',
    detail: [
      'The walkthrough runs on one real entry: 721p, assembly 1, chain A. It is a good test case because it is not just a protein — it carries a ligand and a metal ion, and AlphaFold 3 is the first of the series that can take all three at once.',
      'Chain A contributes 166 amino acids. GNP, a non-hydrolysable GTP analogue, contributes 32 heavy atoms. The Mg²⁺ ion contributes one. Nothing here is a placeholder; the mmCIF ships in this repository under `data/test/pdb_data`.',
    ],
    math: [
      {
        tex: '\\underbrace{166}_{\\text{residues, chain A}} + \\underbrace{\\text{GNP}}_{32\\ \\text{atoms}} + \\underbrace{\\text{Mg}^{2+}}_{1\\ \\text{atom}} \\;\\longrightarrow\\; 1354\\ \\text{heavy atoms}',
        caption: '1321 protein atoms + 33 hetero atoms',
      },
    ],
    inputs: [{ name: '721p-assembly1.cif', symbolic: 'mmCIF', note: 'RCSB entry, assembly 1' }],
    outputs: [
      { name: 'sequence', symbolic: 'str[166]', note: 'MTEYKLVVVGAGGVGKSALT…' },
      { name: 'ligand', symbolic: 'SMILES', note: 'GNP — 32 heavy atoms' },
      { name: 'metal_ion', symbolic: 'str', note: 'Mg' },
    ],
    defines: [
      {
        name: 'sequence',
        symbolic: 'str[166]',
        description: 'One-letter amino acid sequence of chain A, read from the mmCIF.',
      },
    ],
  },
  {
    id: 'alphafold3_input',
    stage: 'input',
    title: 'Describe the complex to the featuriser',
    module: 'Alphafold3Input',
    sourceSymbol: 'Alphafold3Input',
    summary: 'A single dataclass holds proteins, nucleic acids, ligands and ions side by side.',
    detail: [
      '`Alphafold3Input` is the repository\'s front door. You hand it polymers as sequences and everything else as SMILES or ion names, and it does not care which of them you filled in — that uniformity is the point of AlphaFold 3.',
      'For 721p we pass one protein, one ligand SMILES and one metal ion. RDKit expands the SMILES into an explicit heavy-atom graph, which is where the ligand\'s 32 atoms and its bonds come from.',
    ],
    inputs: [
      { name: 'proteins', symbolic: 'list[str]', note: '1 chain' },
      { name: 'ligands', symbolic: 'list[SMILES]', note: 'GNP' },
      { name: 'metal_ions', symbolic: 'list[str]', note: 'Mg' },
    ],
    outputs: [{ name: 'alphafold3_input', symbolic: 'Alphafold3Input' }],
  },
  {
    id: 'tokenise',
    stage: 'input',
    title: 'Tokenise: one token per residue, one per ligand atom',
    module: 'alphafold3_inputs_to_batched_atom_input',
    sourceSymbol: 'alphafold3_inputs_to_batched_atom_input',
    summary: 'n = 199 tokens over m = 1354 atoms. Polymers are pooled per residue; ligands are not.',
    detail: [
      'This is the rule that makes the rest of the shapes make sense. A standard amino acid or nucleotide becomes exactly one token, however many atoms it has. Every heavy atom of a ligand becomes its own token, and so does each metal ion.',
      '166 residues + 32 ligand atoms + 1 ion = 199 tokens, sitting on top of 1354 atoms. `molecule_atom_lens` records how many atoms each token owns, and it is what every pooling and broadcasting operation downstream keys on.',
      'Atoms are also cut into 51 windows of 27 for local attention, which is why atom-pair tensors are stored windowed rather than as a 1354 × 1354 matrix — that would be 1.8 M pairs per channel.',
    ],
    math: [
      {
        tex: 'n = \\underbrace{166}_{\\text{residues}} + \\underbrace{32}_{\\text{ligand atoms}} + \\underbrace{1}_{\\text{ion}} = 199',
        caption: 'token count',
      },
      { tex: 'n_w = \\left\\lceil m / w \\right\\rceil = \\lceil 1354 / 27 \\rceil = 51', caption: 'atom windows' },
    ],
    inputs: [{ name: 'alphafold3_input', symbolic: 'Alphafold3Input' }],
    outputs: [
      { name: 'atom_inputs', symbolic: 'b m dai', concrete: [1, 1354, 3], dtype: 'float32' },
      { name: 'atompair_inputs', symbolic: 'b nw w (w*2) dapi', concrete: [1, 51, 27, 54, 5], dtype: 'float32' },
      { name: 'molecule_atom_lens', symbolic: 'b n', concrete: [1, 199], dtype: 'int64' },
      { name: 'molecule_ids', symbolic: 'b n', concrete: [1, 199], dtype: 'int64' },
      { name: 'is_molecule_types', symbolic: 'b n 5', concrete: [1, 199, 5], dtype: 'bool' },
      { name: 'additional_molecule_feats', symbolic: 'b n 5', concrete: [1, 199, 5], dtype: 'int64' },
    ],
    defines: [
      {
        name: 'atom_inputs',
        symbolic: 'b m dai',
        concrete: [1, 1354, 3],
        dtype: 'float32',
        description: 'Per-atom input features — reference conformer coordinates for each heavy atom.',
      },
      {
        name: 'atompair_inputs',
        symbolic: 'b nw w (w*2) dapi',
        concrete: [1, 51, 27, 54, 5],
        dtype: 'float32',
        description:
          'Per-atom-pair features, stored windowed: 51 windows of 27 atoms, each attending to 54 neighbours.',
      },
      {
        name: 'molecule_atom_lens',
        symbolic: 'b n',
        concrete: [1, 199],
        dtype: 'int64',
        description: 'Atoms owned by each token. Sums to m = 1354. Drives every pool and broadcast.',
      },
      {
        name: 'molecule_ids',
        symbolic: 'b n',
        concrete: [1, 199],
        dtype: 'int64',
        description: 'Residue or molecule identity per token, indexing the 32-way restype embedding.',
      },
      {
        name: 'is_molecule_types',
        symbolic: 'b n 5',
        concrete: [1, 199, 5],
        dtype: 'bool',
        description: 'One-hot over protein, RNA, DNA, ligand, metal ion. Here 83.4 % protein, 16.1 % ligand, 0.5 % ion.',
      },
      {
        name: 'additional_molecule_feats',
        symbolic: 'b n 5',
        concrete: [1, 199, 5],
        dtype: 'int64',
        description: 'residue_index, token_index, asym_id, entity_id, sym_id — the bookkeeping the relative position encoding reads.',
      },
    ],
  },
]
