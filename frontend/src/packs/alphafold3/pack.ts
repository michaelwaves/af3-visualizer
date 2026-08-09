import type { ModelPack } from '@engine/types'
import { alphafold3Axes } from './axes'
import { settingChapters } from './chapters/setting'
import { tokenChapters } from './chapters/tokens'
import { embeddingChapters } from './chapters/embedding'
import { evolutionChapters } from './chapters/evolution'
import { geometryChapters } from './chapters/geometry'
import { structureChapters } from './chapters/structure'
import { confidenceChapters } from './chapters/confidence'
import { scenes } from './scenes'

export const alphafold3Pack: ModelPack = {
  id: 'alphafold3',
  title: 'AlphaFold 3, visualized',
  subtitle: 'a walkthrough of the architecture, measured on a real complex',
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
    ...confidenceChapters,
  ],
  scenes,
  axes: alphafold3Axes,
  data: {
    structure: 'data/structure.json',
    features: 'data/features.json',
    msa: 'data/msa.json',
    template: 'data/template.json',
    model: 'data/model.json',
    activations: 'data/activations.json',
    predictions: 'data/predictions.json',
    diffusion: 'data/diffusion.json',
  },
}
