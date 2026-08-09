import type { Payloads } from '@/data/types'
import type { Step } from '@/model/types'
import { MsaFigure } from '../figures/MsaFigure'
import { ScheduleFigure } from '../figures/ScheduleFigure'
import { ConfidenceFigure, DistogramFigure, TemplateFigure } from '../figures/OutputFigure'

export function DataPanel({ step, payloads }: { step: Step; payloads: Payloads }) {
  switch (step.id) {
    case 'msa_search':
    case 'msa_features':
      return <MsaFigure msa={payloads.msa} />
    case 'template_features':
      return <TemplateFigure template={payloads.template} />
    case 'edm_schedule':
      return <ScheduleFigure diffusion={payloads.diffusion} view="schedule" />
    case 'preconditioning':
      return <ScheduleFigure diffusion={payloads.diffusion} view="preconditioning" />
    case 'edm_sample':
      return <ScheduleFigure diffusion={payloads.diffusion} view="trajectory" />
    case 'confidence_head':
    case 'outputs':
      return <ConfidenceFigure predictions={payloads.predictions} />
    case 'distogram_head':
      return <DistogramFigure predictions={payloads.predictions} />
    default:
      return <p className="panel__empty">No measured data beyond the activation map for this step.</p>
  }
}
