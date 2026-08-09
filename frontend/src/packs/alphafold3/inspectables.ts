import type { InspectableTensor, Provenance } from '@engine/inspector/types'
import type { ActivationData, PredictionData, TemplateData } from './data'

/**
 * Every matrix the walkthrough draws, exposed for inspection and export. The
 * activation maps carry the provenance the extractor recorded; the derived maps
 * describe themselves here, next to the code that builds them.
 */
export const alphafold3Inspectables = (data: Record<string, unknown>): InspectableTensor[] => {
  const activations = data.activations as ActivationData | undefined
  const predictions = data.predictions as PredictionData | undefined
  const template = data.template as TemplateData | undefined
  const tensors: InspectableTensor[] = []

  for (const group of [activations?.pairMaps, activations?.singleMaps, activations?.attentionHeads]) {
    for (const [key, matrix] of Object.entries(group ?? {})) {
      tensors.push({ key, matrix, provenance: activations?.provenance?.[key] })
    }
  }

  if (predictions?.pae) {
    tensors.push({ key: 'pae', matrix: predictions.pae, provenance: headProvenance('pae', 64) })
  }
  if (predictions?.distogram) {
    tensors.push({
      key: 'distogram',
      matrix: predictions.distogram,
      provenance: headProvenance('distogram', 64),
    })
  }
  if (template) {
    tensors.push({
      key: 'template_distances',
      matrix: template.templateDistances,
      provenance: distanceProvenance(template),
    })
  }
  return tensors
}

/** PAE and the distogram are expectations over bins, not raw logits. */
const headProvenance = (name: string, bins: number): Provenance => ({
  kind: 'pair',
  module: name === 'pae' ? 'ConfidenceHead' : 'DistogramHead',
  qualifiedName: `alphafold3_pytorch.alphafold3.${name === 'pae' ? 'ConfidenceHead' : 'DistogramHead'}`,
  algorithm: name === 'pae' ? 'Algorithm 31' : 'distogram head',
  fullShape: [1, bins, 199, 199],
  drawnShape: [199, 199],
  reduction: `softmax over ${bins} bins, then expectation — ångström, not logits`,
  dependsOnWeights: true,
})

const distanceProvenance = (template: TemplateData): Provenance => ({
  kind: 'pair',
  module: 'template_extractor',
  qualifiedName: 'frontend/tools/template_extractor.py',
  algorithm: 'Euclidean distance between alpha carbons',
  fullShape: [template.residues, template.residues],
  drawnShape: [template.residues, template.residues],
  reduction: 'none — these are measured ångström distances',
  dependsOnWeights: false,
})
