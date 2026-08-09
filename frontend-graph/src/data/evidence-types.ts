/** Payloads describing the inputs the model read and the outputs it produced. */

import type { ActivationMap, SourceIndex, Trace } from './types'

export interface MsaPayload {
  source: string
  depth: number
  length: number
  query: string
  alphabet: string
  rows: { accession: string; identity: number; gaps: number; organism: string | null }[]
  tokens: number[][]
  conservation: number[]
  gapFraction: number[]
  identityHistogram: number[]
}

export interface Predictions {
  plddt: number[]
  pae: number[][]
  distogram: number[][]
  bins: Record<string, number>
  tokenCount: number
  atomCount: number
  note: string
}

export interface Diffusion {
  sigmas: number[]
  sigmaData: number
  sigmaMin: number
  sigmaMax: number
  rho: number
  stepScale: number
  churn: Record<string, number>
  preconditioning: { sigma: number; cSkip: number; cOut: number; cIn: number }[]
  radiusOfGyration: number[]
  note: string
}

export interface StructurePayload {
  name: string
  source: string
  sequence: string
  counts: Record<string, number>
  ligands: { code: string; kind: string; atomCount: number }[]
}

export interface ModelPayload {
  totalParameters: number
  modules: { name: string; parameters: number }[]
  dimensions: Record<string, number>
  depths: Record<string, number>
  input: Record<string, number>
}

export interface TemplatePayload {
  source: string
  residues: number
  binCount: number
  featureWidth: number
  features: { name: string; width: number; note: string }[]
  agreement: number
}

export interface Payloads {
  trace: Trace
  maps: Record<string, ActivationMap>
  source: SourceIndex
  msa: MsaPayload
  predictions: Predictions
  diffusion: Diffusion
  structure: StructurePayload
  model: ModelPayload
  template: TemplatePayload
}
