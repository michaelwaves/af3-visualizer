/** The authored walkthrough: what the debugger stops at and what it says there. */

export type StageId = 'input' | 'embed' | 'trunk' | 'diffusion' | 'confidence'

export interface Stage {
  id: StageId
  label: string
  blurb: string
}

/** A tensor as the code names it, with both the einops shape and the real one. */
export interface TensorSpec {
  name: string
  symbolic: string
  concrete?: number[]
  dtype?: string
  note?: string
}

export interface MathLine {
  tex: string
  caption?: string
}

export interface Step {
  id: string
  stage: StageId
  title: string
  module: string
  algorithm?: string
  /** Key into `source.json`; the Code panel shows exactly these lines. */
  sourceSymbol?: string
  /** Key into `trace.json` and `maps.json`; the real recorded call. */
  traceId?: string
  /** Shown as the loop annotation next to the execution pointer. */
  repeats?: string
  summary: string
  detail: string[]
  math?: MathLine[]
  inputs: TensorSpec[]
  outputs: TensorSpec[]
  /** Variables that come into scope, or are rebound, at this step. */
  defines?: Variable[]
}

export interface Variable extends TensorSpec {
  description: string
  /** Marks a rebinding of a name already in scope, like `pairwise` in the trunk. */
  rebinds?: boolean
}

export interface ScopeEntry extends Variable {
  definedAt: string
  updated: boolean
}

export const STAGES: Stage[] = [
  {
    id: 'input',
    label: 'Featurisation',
    blurb: 'From a PDB id to the tensors the network can read.',
  },
  {
    id: 'embed',
    label: 'Input embedding',
    blurb: 'Atoms become tokens; the single and pairwise streams are born.',
  },
  {
    id: 'trunk',
    label: 'Trunk',
    blurb: 'Templates, alignment and 48 Pairformer blocks refine the pair map.',
  },
  {
    id: 'diffusion',
    label: 'Diffusion',
    blurb: 'A denoiser walks Gaussian noise down to atomic coordinates.',
  },
  {
    id: 'confidence',
    label: 'Confidence',
    blurb: 'The model scores how much of its own answer it believes.',
  },
]
