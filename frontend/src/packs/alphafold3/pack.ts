import type { ModelPack } from '@engine/types'
import { alphafold3Architecture } from './architecture'
import { alphafold3Axes } from './axes'
import { alphafold3Inspectables } from './inspectables'
import { alphafold3Pipeline } from './pipeline'
import { alphafold3Reference } from './reference'
import { settingChapters } from './chapters/setting'
import { tokenChapters } from './chapters/tokens'
import { embeddingChapters } from './chapters/embedding'
import { evolutionChapters } from './chapters/evolution'
import { geometryChapters } from './chapters/geometry'
import { structureChapters } from './chapters/structure'
import { confidenceChapters } from './chapters/confidence'
import { foldedChapters } from './chapters/folded'
import { scenes } from './scenes'

export const alphafold3Pack: ModelPack = {
  id: 'alphafold3',
  title: 'AlphaFold 3, visualized',
  subtitle: 'a walkthrough of inference on',
  target: {
    label: 'PDB 721P',
    href: 'https://www.rcsb.org/structure/721P',
    description: 'H-Ras P21 with a GTP analogue and magnesium — Krengel et al., 1990',
  },
  source: {
    label: 'lucidrains/alphafold3-pytorch',
    href: 'https://github.com/lucidrains/alphafold3-pytorch',
  },
  chapters: [
    ...settingChapters,
    ...tokenChapters,
    ...embeddingChapters,
    ...evolutionChapters,
    ...geometryChapters,
    ...structureChapters,
    ...foldedChapters,
    ...confidenceChapters,
  ],
  scenes,
  axes: alphafold3Axes,
  pipeline: alphafold3Pipeline,
  diagram: alphafold3Architecture,
  inspectables: alphafold3Inspectables,
  reference: alphafold3Reference,
  data: {
    structure: 'data/structure.json',
    source: 'data/source.json',
    raw: 'data/raw.json',
    boltz: 'data/boltz.json',
    features: 'data/features.json',
    msa: 'data/msa.json',
    template: 'data/template.json',
    model: 'data/model.json',
    activations: 'data/activations.json',
    predictions: 'data/predictions.json',
    diffusion: 'data/diffusion.json',
  },
}
