import type { AxisDefinition } from '@engine/types'

/**
 * Every axis symbol the shape chips use. Sizes are the measured values for this
 * walkthrough's example — H-Ras with its GTP analogue and magnesium ion.
 */
export const alphafold3Axes: Record<string, AxisDefinition> = {
  b: { label: 'batch', meaning: 'complexes predicted at once', size: 1, group: 'sequence' },
  n: { label: 'tokens', meaning: 'residues, plus one per ligand or ion atom', size: 199, group: 'sequence' },
  m: { label: 'atoms', meaning: 'heavy atoms, hydrogens excluded', size: 1354, group: 'sequence' },
  s: { label: 'sequences', meaning: 'rows of the alignment, subsampled per pass', size: 64, group: 'sequence' },
  t: { label: 'templates', meaning: 'homologous structures supplied as evidence', size: 2, group: 'sequence' },

  ds: { label: 'single channels', meaning: 'width of the per-token representation', size: 384, group: 'channels' },
  dp: { label: 'pair channels', meaning: 'width of the per-token-pair representation', size: 128, group: 'channels' },
  dm: { label: 'MSA channels', meaning: 'width of the per-alignment-cell representation', size: 64, group: 'channels' },
  dt: { label: 'template features', meaning: 'distogram, unit vector, masks and both residue types', size: 108, group: 'channels' },
  d: { label: 'channels', meaning: 'feature width of the tensor in question', group: 'channels' },
  dim: { label: 'width', meaning: 'hidden width of the transformer', size: 768, group: 'channels' },

  dai: { label: 'atom inputs', meaning: 'reference-conformer features per atom', size: 3, group: 'inputs' },
  dapi: { label: 'atom-pair inputs', meaning: 'bond and same-residue features per atom pair', size: 5, group: 'inputs' },
  dtf: { label: 'token features', meaning: '32-way alignment profile plus mean deletion count', size: 33, group: 'inputs' },

  h: { label: 'heads', meaning: 'attention heads', size: 16, group: 'attention' },
  heads: { label: 'heads', meaning: 'attention heads', size: 16, group: 'attention' },
  w: { label: 'window', meaning: 'atoms attending together — one tryptophan’s worth', size: 27, group: 'attention' },
  '2w': { label: 'window span', meaning: 'each window also sees its neighbour', size: 54, group: 'attention' },
  nw: { label: 'windows', meaning: 'sequence-local atom windows', size: 51, group: 'attention' },

  bins: { label: 'bins', meaning: 'discretised buckets the head predicts over', group: 'outputs' },
  blocks: { label: 'blocks', meaning: 'repeated layers in the stack', group: 'outputs' },
  steps: { label: 'steps', meaning: 'diffusion sampling steps, plus the final σ = 0', size: 33, group: 'outputs' },
  residues: { label: 'residues', meaning: 'amino acids in the protein chain', size: 166, group: 'sequence' },
  seconds: { label: 'seconds', meaning: 'wall-clock for one full forward pass', group: 'outputs' },
  GB: { label: 'gigabytes', meaning: 'peak GPU memory during that pass', group: 'outputs' },
}
