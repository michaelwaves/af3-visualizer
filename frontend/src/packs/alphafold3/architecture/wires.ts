import type { DiagramWire } from '@engine/narrative/architecture/types'

/** Every arrow in the diagram, routed to match `Alphafold3.forward`.
 *
 * Three lanes run above the trunk at y = 22, 31 and 40: the raw inputs, and the
 * trunk's two outputs. Both the denoiser and the confidence head feed off them,
 * which is why those tensors appear to skip most of the network — they do.
 */
export const architectureWires: DiagramWire[] = [
  // --- searches, in orange -------------------------------------------------
  { d: 'M58,126 V24', role: 'input', head: false },
  { d: 'M58,24 H74', role: 'input' },
  { d: 'M58,62 H74', role: 'input' },
  { d: 'M58,100 H74', role: 'input' },
  { d: 'M58,126 H246', role: 'input' },
  { d: 'M168,62 H246', role: 'input' },
  { d: 'M168,100 H246', role: 'input' },
  { d: 'M182,24 V6 H500 V48', role: 'input' },
  { d: 'M196,62 V13 H620 V48', role: 'input' },

  // --- the two streams leaving the embedder, in blue ----------------------
  { d: 'M348,70 H412', role: 'trunk', head: false },
  { d: 'M436,70 H460', role: 'trunk' },
  { d: 'M560,70 H576', role: 'trunk' },
  { d: 'M668,70 H684', role: 'trunk' },
  { d: 'M348,116 H412', role: 'trunk', head: false },
  { d: 'M436,116 H676 V84 H684', role: 'trunk' },

  // --- the three lanes over the top ---------------------------------------
  { d: 'M348,22 H1286', role: 'trunk' },
  { d: 'M828,58 H846 V31 H1286', role: 'trunk' },
  { d: 'M828,86 H862 V40 H1286', role: 'trunk' },

  // --- lanes dropping into the denoiser ------------------------------------
  { d: 'M1006,22 V42', role: 'trunk' },
  { d: 'M1030,31 V42', role: 'trunk' },
  { d: 'M1054,40 V42', role: 'trunk' },

  // --- sampling, in green --------------------------------------------------
  { d: 'M932,70 H940', role: 'sample' },
  { d: 'M960,70 H974', role: 'sample' },
  { d: 'M1110,70 H1132', role: 'sample' },
  { d: 'M1188,70 H1392 V64', role: 'sample' },

  // --- recycling and diffusion iterations, dashed --------------------------
  { d: 'M760,98 V138 H412 V82', role: 'trunk', dashed: true },
  { d: 'M424,138 V128', role: 'trunk', dashed: true },
  { d: 'M1110,98 V132 H952 V82', role: 'sample', dashed: true },
]
