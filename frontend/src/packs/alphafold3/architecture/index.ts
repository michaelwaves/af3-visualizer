import type { ArchitectureDiagram } from '@engine/narrative/architecture/types'
import { inputNodes } from './nodes'
import { trunkNodes } from './trunk-nodes'
import { architectureWires } from './wires'

/** AlphaFold 3's inference diagram, after Figure 1d of the paper. */
export const alphafold3Architecture: ArchitectureDiagram = {
  viewBox: [1430, 156],
  nodes: [...inputNodes, ...trunkNodes],
  wires: architectureWires,
  labels: [
    { text: 'Sequences,', x: 48, y: 56, role: 'input', anchor: 'end' },
    { text: 'ligands,', x: 48, y: 68, role: 'input', anchor: 'end' },
    { text: 'covalent bonds', x: 48, y: 80, role: 'input', anchor: 'end' },
    { text: 'Recycling', x: 586, y: 150, role: 'trunk', anchor: 'middle' },
    { text: 'Diffusion iterations', x: 1031, y: 146, role: 'sample', anchor: 'middle' },
    { text: '0', x: 1290, y: 80, faint: true, anchor: 'start' },
    { text: '100', x: 1372, y: 80, faint: true, anchor: 'end' },
  ],
  caption:
    'Dashed blue is recycling; dashed green is the sampler walking the same denoiser down 32 noise ' +
    'levels. Click any box to jump to its chapter.',
}
