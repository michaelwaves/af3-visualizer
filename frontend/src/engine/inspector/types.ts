/** What the extractor recorded about how a drawn matrix was produced. */
export interface Provenance {
  kind: 'pair' | 'single' | 'attention'
  module: string | null
  qualifiedName: string | null
  algorithm: string | null
  fullShape: number[]
  drawnShape: number[]
  /** Plain-language description of the reduction from full tensor to matrix. */
  reduction: string
  /** Stats over the *full* tensor. Absent when only the drawn matrix exists. */
  statistics?: { min: number; max: number; mean: number; std: number; elements: number }
  /** False when the values follow from the inputs alone, as for relative positions. */
  dependsOnWeights: boolean
  note?: string
}

/** A matrix the inspector can show, download, and explain. */
export interface InspectableTensor {
  key: string
  matrix: number[][]
  provenance?: Provenance
}
