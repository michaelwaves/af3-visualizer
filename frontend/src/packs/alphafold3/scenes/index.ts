import type { SceneComponent } from '@engine/types'
import { ComplexScene } from './ComplexScene'
import { TokensScene } from './TokensScene'
import { FeaturesScene } from './FeaturesScene'
import { EmbedderScene } from './EmbedderScene'
import { RelPosScene } from './RelPosScene'
import { MsaScene } from './MsaScene'
import { MsaPairScene } from './MsaPairScene'
import { TemplatesScene } from './TemplatesScene'
import { TrianglesScene } from './TrianglesScene'
import { PairformerScene } from './PairformerScene'
import { NoiseScene } from './NoiseScene'
import { DiffusionScene } from './DiffusionScene'
import { ConfidenceScene } from './ConfidenceScene'
import { FoldedScene } from './FoldedScene'
import { OverviewScene } from './OverviewScene'

/** Chapter `scene` keys resolve here. Adding a chapter means adding a scene. */
export const scenes: Record<string, SceneComponent> = {
  complex: ComplexScene,
  tokens: TokensScene,
  features: FeaturesScene,
  embedder: EmbedderScene,
  relpos: RelPosScene,
  msa: MsaScene,
  msaPair: MsaPairScene,
  templates: TemplatesScene,
  triangles: TrianglesScene,
  pairformer: PairformerScene,
  noise: NoiseScene,
  diffusion: DiffusionScene,
  confidence: ConfidenceScene,
  folded: FoldedScene,
  overview: OverviewScene,
}
