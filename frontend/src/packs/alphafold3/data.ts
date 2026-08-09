import { usePackData } from '@engine/store'
import type { Provenance } from '@engine/inspector/types'

export interface StructureData {
  name: string
  source: string
  chain: string
  sequence: string
  residues: { code: string; name: string; index: number; atomCount: number; ca: number[]; bFactor: number }[]
  backbone: number[][]
  atoms: { element: string[]; position: number[][]; residueIndex: number[]; isHetero: boolean[] }
  ligands: {
    code: string
    residueIndex: number
    kind: string
    atomCount: number
    element: string[]
    atomName: string[]
    position: number[][]
  }[]
  counts: { residues: number; proteinAtoms: number; heteroAtoms: number; totalAtoms: number }
}

export interface MsaData {
  source: string
  depth: number
  length: number
  query: string
  alphabet: string
  alphabetSize: number
  rows: {
    accession: string
    identity: number
    gaps: number
    organism: string | null
    icon: string
    clade: string
  }[]
  tokens: number[][]
  conservation: number[]
  gapFraction: number[]
  identityHistogram: number[]
}

export interface TemplateData {
  source: string
  residues: number
  bins: number[]
  binCount: number
  featureWidth: number
  features: { name: string; width: number; note: string }[]
  templateDistances: number[][]
  targetDistances: number[][]
  binnedTemplate: number[][]
  agreement: number
  backbone: number[][]
}

export interface ModelData {
  totalParameters: number
  modules: { name: string; parameters: number }[]
  dimensions: Record<string, number>
  depths: Record<string, number>
  input: Record<string, number>
  measured: {
    device: string
    forwardSeconds: number
    peakMemoryGb: number
    moleculeAtomLens: number[]
    isMoleculeTypes: number[]
  }
}

export interface ActivationData {
  size: number
  pairMaps: Record<string, number[][]>
  singleMaps: Record<string, number[][]>
  attentionHeads: Record<string, number[][]>
  provenance: Record<string, Provenance>
  shapes: Record<string, number[]>
}

export interface PredictionData {
  plddt: number[]
  pae: number[][] | null
  distogram: number[][]
  bins: Record<string, number>
  tokenCount: number
  atomCount: number
  note: string
}

export interface DiffusionData {
  sigmas: number[]
  sigmaData: number
  sigmaMin: number
  sigmaMax: number
  rho: number
  stepScale: number
  churn: Record<string, number>
  preconditioning: { sigma: number; cSkip: number; cOut: number; cIn: number }[]
  steps: number[][][]
  radiusOfGyration: number[]
  note: string
}

export interface FeatureTensor {
  name: string
  shape: string
  role: string
  actualShape: number[]
  values: number[][]
}

export interface FeatureData {
  tensors: FeatureTensor[]
  typeFractions: number[]
  typeNames: string[]
}

export const useStructure = () => usePackData<StructureData>('structure')
export const useFeatures = () => usePackData<FeatureData>('features')
export const useMsa = () => usePackData<MsaData>('msa')
export const useTemplate = () => usePackData<TemplateData>('template')
export const useModel = () => usePackData<ModelData>('model')
export const useActivations = () => usePackData<ActivationData>('activations')
export const usePredictions = () => usePackData<PredictionData>('predictions')
export const useDiffusion = () => usePackData<DiffusionData>('diffusion')
