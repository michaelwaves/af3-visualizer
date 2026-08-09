import type { ChapterReference } from '@engine/types'
import { structureReference } from './structure'
import { trunkReference } from './trunk'

/** Maths and source excerpts, keyed by chapter id. */
export const alphafold3Reference: Record<string, ChapterReference> = {
  tokens: {
    equations: [
      {
        label: 'tokenisation',
        latex: String.raw`n = \underbrace{|R|}_{\text{residues}} + \underbrace{\textstyle\sum_{\ell} |A_{\ell}|}_{\text{ligand atoms}} + \underbrace{|I|}_{\text{ions}} = 166 + 32 + 1 = 199`,
        note: 'A standard residue is one token whatever its atom count; every ligand heavy atom is its own token. That asymmetry is the whole trick.',
      },
      {
        label: 'windowed atom attention',
        latex: String.raw`\text{atom } a \text{ attends to } \{\,b : \lfloor b/w \rfloor \in \{\lfloor a/w \rfloor - 1,\ \lfloor a/w \rfloor\}\,\}, \qquad w = 27`,
        note: 'Each window of 27 sees itself and its predecessor — 54 keys per query — so cost is linear in atoms rather than quadratic.',
      },
    ],
  },
  ...structureReference,
  ...trunkReference,
}
