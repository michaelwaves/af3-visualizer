import type { PipelineStage } from '@engine/types'

/**
 * `Alphafold3.forward` in execution order, named after the classes it calls.
 * Stages marked `loop` run once per recycling step.
 */
export const alphafold3Pipeline: PipelineStage[] = [
  {
    id: 'featurise',
    label: 'featurise',
    module: 'Alphafold3Input',
    qualifiedName: 'alphafold3_pytorch.inputs.Alphafold3Input',
    note: 'sequence, SMILES and ion names → atom and token tensors',
  },
  {
    id: 'embed',
    label: 'embed inputs',
    module: 'InputFeatureEmbedder',
    qualifiedName: 'alphafold3_pytorch.alphafold3.InputFeatureEmbedder',
    algorithm: 'Algorithm 2',
    note: 'atom transformer, then pool to tokens',
  },
  {
    id: 'relpos',
    label: 'rel. positions',
    module: 'RelativePositionEncoding',
    qualifiedName: 'alphafold3_pytorch.alphafold3.RelativePositionEncoding',
    algorithm: 'Algorithm 3',
  },
  {
    id: 'templates',
    label: 'templates',
    module: 'TemplateEmbedder',
    qualifiedName: 'alphafold3_pytorch.alphafold3.TemplateEmbedder',
    algorithm: 'Algorithm 16',
    loop: true,
  },
  {
    id: 'msa',
    label: 'MSA',
    module: 'MSAModule',
    qualifiedName: 'alphafold3_pytorch.alphafold3.MSAModule',
    algorithm: 'Algorithm 8',
    loop: true,
  },
  {
    id: 'pairformer',
    label: 'Pairformer',
    module: 'PairformerStack',
    qualifiedName: 'alphafold3_pytorch.alphafold3.PairformerStack',
    algorithm: 'Algorithm 17',
    loop: true,
    note: '48 blocks — the bulk of the trunk',
  },
  {
    id: 'sample',
    label: 'sample',
    module: 'ElucidatedAtomDiffusion',
    qualifiedName: 'alphafold3_pytorch.alphafold3.ElucidatedAtomDiffusion.sample',
    algorithm: 'Algorithm 18',
    note: 'calls DiffusionModule once per noise level',
  },
  {
    id: 'denoise',
    label: 'denoise',
    module: 'DiffusionModule',
    qualifiedName: 'alphafold3_pytorch.alphafold3.DiffusionModule',
    algorithm: 'Algorithm 20',
    note: 'atom encoder → token transformer → atom decoder',
  },
  {
    id: 'confidence',
    label: 'confidence',
    module: 'ConfidenceHead',
    qualifiedName: 'alphafold3_pytorch.alphafold3.ConfidenceHead',
    algorithm: 'Algorithm 31',
    note: 'pLDDT, PAE, PDE, resolved',
  },
]
