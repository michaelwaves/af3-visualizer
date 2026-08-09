import type { GraphNode } from '../types'

/** The top level: `Alphafold3.forward` from a PDB id to a structure. */
/** Where the data comes from, before any weights are involved. */
export const rootSourceNodes: GraphNode[] = [
  {
    id: 'pdb',
    label: 'PDB 721p',
    module: 'mmCIF',
    kind: 'source',
    summary: 'H-Ras P21 chain A, a GTP analogue and a magnesium ion.',
    detail: [
      '166 amino acids, the 32 heavy atoms of GNP, and one Mg²⁺. The assembly ships in this repository under `data/test/pdb_data`.',
      'It is a useful test case precisely because it is not just a protein — AlphaFold 3 is the first of the series that takes polymer, ligand and ion in one pass.',
    ],
  },
  {
    id: 'msa_search',
    label: 'ColabFold search',
    module: 'MMseqs2',
    kind: 'source',
    summary: '15,953 homologs against UniRef and an environmental set.',
    detail: [
      'The alignment is the real `721p-assembly1A_protein.a3m`, precomputed by a ColabFold/MMseqs2 search and shipped with the repository rather than re-searched at capture time.',
      'Each header carries the MMseqs2 fields: accession, bit score, identity, e-value, and the query and target ranges. Top hits sit above 96 % identity; the tail runs down into distant GTPases.',
    ],
  },
  {
    id: 'template_source',
    label: 'AlphaFold DB model',
    module: 'AF-P01112-F1',
    kind: 'source',
    summary: 'An independent structure of the same protein, used as a template.',
    detail: [
      'Mean absolute disagreement with the crystal structure’s Cα–Cα distances is 0.39 Å — close, but genuinely independent, which is what makes it a template rather than the answer.',
    ],
  },
  {
    id: 'featurise',
    label: 'Featurise',
    module: 'Alphafold3Input',
    kind: 'op',
    sourceSymbol: 'alphafold3_inputs_to_batched_atom_input',
    summary: 'n = 199 tokens over m = 1354 atoms.',
    detail: [
      'One token per amino acid or nucleotide, however many atoms it has; one token per heavy atom of every ligand, and one per ion. 166 + 32 + 1 = 199.',
      '`molecule_atom_lens` records how many atoms each token owns, and every pooling and broadcasting operation downstream keys on it. Atoms are also cut into 51 windows of 27 for local attention.',
    ],
  },
  {
    id: 'msa_features',
    label: 'Encode alignment',
    module: 'MSA featurisation',
    kind: 'op',
    summary: 'Top 64 rows one-hot over 32 symbols, plus two deletion features.',
    detail: [
      'One alphabet covers every polymer type: 20 amino acids + unknown, 4 RNA + unknown, 4 DNA + unknown, and a gap. Ligand and ion tokens have no alignment, so they sit at the gap symbol — the true feature, not padding.',
      'Separately the *whole* alignment is reduced to a 32-wide per-column profile and concatenated onto the single stream, so the depth of the search survives even though only 64 rows are attended over.',
    ],
  },
  {
    id: 'template_features',
    label: 'Encode template',
    module: 'Template featurisation',
    kind: 'op',
    summary: '108 features per token pair: distogram, direction, masks, residue types.',
    detail: [
      '39 distance bins over 3.25–50.75 Å, the unit vector from i to j written in residue i’s own backbone frame, two resolved-masks, and the one-hot identity of both residues. 39 + 3 + 1 + 1 + 32 + 32 = 108.',
      'Because the direction is expressed in a local frame, the whole feature is invariant to how the template happens to be rotated in space.',
    ],
  },
]
