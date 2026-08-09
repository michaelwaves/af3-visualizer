import { useMemo } from 'react'
import type { Predictions, TemplatePayload } from '@/data/types'
import { toActivationMap } from '@/lib/matrix'
import { Heatmap } from '../Heatmap'
import { LineChart } from './LineChart'

/** pLDDT, PAE and the distogram — the maps people actually read off a prediction. */
export function ConfidenceFigure({ predictions }: { predictions: Predictions }) {
  const pae = useMemo(
    () => toActivationMap(predictions.pae, ['token j', 'token i'], 'expected error over 64 bins'),
    [predictions.pae],
  )
  return (
    <div className="figure">
      <div className="figure__head">
        <span className="figure__title">Predicted aligned error</span>
        <span className="figure__sub">expectation over 64 bins spanning 0.5–32 Å</span>
      </div>
      <Heatmap map={pae} />
      <LineChart
        series={[{ id: 'plddt', label: 'pLDDT', values: predictions.plddt }]}
        xLabel="atom"
        yLabel="0–100"
        height={180}
      />
      <p className="figure__note">
        pLDDT is per atom — all {predictions.atomCount.toLocaleString()} of them. In this untrained
        capture it sits near 50 everywhere, which is what a uniform distribution over the 50 bins
        gives. A trained model would show high plateaus over the folded core and troughs at the loops.
      </p>
    </div>
  )
}

export function DistogramFigure({ predictions }: { predictions: Predictions }) {
  const map = useMemo(
    () => toActivationMap(predictions.distogram, ['token j', 'token i'], 'expected distance over 64 bins'),
    [predictions.distogram],
  )
  return (
    <div className="figure">
      <div className="figure__head">
        <span className="figure__title">Expected distance</span>
        <span className="figure__sub">64 bins over 2–22 Å, {predictions.tokenCount} × {predictions.tokenCount} tokens</span>
      </div>
      <Heatmap map={map} />
      <p className="figure__note">
        Read as a contact map: dark is close. The diagonal is every token against itself. In a trained
        model the off-diagonal blocks are the β-sheet pairings and the helix packing.
      </p>
    </div>
  )
}

export function TemplateFigure({ template }: { template: TemplatePayload }) {
  return (
    <div className="figure">
      <div className="figure__head">
        <span className="figure__title">{template.source}</span>
        <span className="figure__sub">
          {template.residues} residues, {template.featureWidth} features per pair
        </span>
      </div>
      <table className="breakdown">
        <thead>
          <tr>
            <th>feature</th>
            <th>width</th>
            <th>what it encodes</th>
          </tr>
        </thead>
        <tbody>
          {template.features.map((feature) => (
            <tr key={feature.name}>
              <td>{feature.name}</td>
              <td>{feature.width}</td>
              <td>{feature.note}</td>
            </tr>
          ))}
          <tr className="breakdown__total">
            <td>total</td>
            <td>{template.featureWidth}</td>
            <td>per ordered token pair</td>
          </tr>
        </tbody>
      </table>
      <p className="figure__note">
        Mean absolute disagreement between the template's Cα–Cα distances and the crystal structure's
        is {template.agreement} Å — close, but independent. That gap is exactly what makes it a useful
        template rather than the answer.
      </p>
    </div>
  )
}
