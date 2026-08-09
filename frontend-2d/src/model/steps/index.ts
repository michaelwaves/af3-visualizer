import type { ScopeEntry, Step } from '../types'
import { confidenceSteps } from './confidence'
import { diffusionSteps } from './diffusion'
import { diffusionAtomSteps } from './diffusion-atoms'
import { diffusionDenoiserSteps } from './diffusion-denoiser'
import { embedSteps } from './embed'
import { evidenceSteps } from './evidence'
import { inputSteps } from './input'
import { msaSteps } from './msa'
import { pairInitSteps } from './pair-init'
import { pairformerSteps } from './pairformer'
import { pairformerAttentionSteps } from './pairformer-attention'
import { trunkEvidenceSteps } from './trunk-evidence'

/** The forward pass, in execution order. */
export const STEPS: Step[] = [
  ...inputSteps,
  ...evidenceSteps,
  ...embedSteps,
  ...pairInitSteps,
  ...trunkEvidenceSteps,
  ...msaSteps,
  ...pairformerSteps,
  ...pairformerAttentionSteps,
  ...diffusionSteps,
  ...diffusionDenoiserSteps,
  ...diffusionAtomSteps,
  ...confidenceSteps,
]

export const stepIndex = (id: string): number => STEPS.findIndex((step) => step.id === id)

/** Everything in scope once execution has reached `index`, newest binding wins. */
export function scopeAt(index: number): ScopeEntry[] {
  const scope = new Map<string, ScopeEntry>()
  STEPS.slice(0, index + 1).forEach((step) => {
    step.defines?.forEach((variable) => {
      scope.set(variable.name, {
        ...variable,
        definedAt: step.id,
        updated: step.id === STEPS[index].id,
      })
    })
  })
  return [...scope.values()]
}
