/** The recorded forward pass: module signatures, maps and source snippets. */

export interface TensorStats {
  min: number
  max: number
  mean: number
  std: number
  absMean?: number
  zeroFraction?: number
  elements: number
}

export interface Binding {
  name: string
  shape: number[]
  dtype: string
  stats: TensorStats | null
}

export interface TraceStep {
  id: string
  module: string
  qualifiedName: string
  path: string
  algorithm: string | null
  kind: string
  calls: number
  parameters: number
  inputs: Binding[]
  outputs: Binding[]
}

export interface TraceMeta {
  pdbId: string
  title: string
  device: string
  forwardSeconds: number
  peakMemoryGb: number | null
  totalParameters: number
  tokens: number
  atoms: number
  msaDepth: number
  msaSource: string
  templates: number
  templateSource: string
  sampleSteps: number
  recyclingSteps: number
  torch: string
  note: string
  dims: Record<string, number>
}

export interface Trace {
  meta: TraceMeta
  steps: TraceStep[]
}

export interface ActivationMap {
  rows: number
  cols: number
  min: number
  max: number
  data: string
  reduction: string
  axes: [string, string]
  fullShape: number[]
}

export interface Snippet {
  symbol: string
  file: string
  startLine: number
  endLine: number
  lines: number
  code: string
}

export interface SourceIndex {
  repository: string
  commit: string
  snippets: Record<string, Snippet>
}

export * from './evidence-types'
