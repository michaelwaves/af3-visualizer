import type { Diffusion } from '@/data/types'
import { LineChart } from './LineChart'

/** Drops the terminal σ = 0 entry, which a logarithmic axis cannot place. */
const withoutFinal = (values: number[]): number[] => values.slice(0, -1)

/** The real EDM ladder and the path the sampler walked down it. */
export function ScheduleFigure({ diffusion, view }: { diffusion: Diffusion; view: 'schedule' | 'preconditioning' | 'trajectory' }) {
  if (view === 'preconditioning') {
    return (
      <div className="figure">
        <div className="figure__head">
          <span className="figure__title">Preconditioning coefficients</span>
          <span className="figure__sub">across the 33 noise levels, σ = 1280 → 0</span>
        </div>
        <LineChart
          series={[
            { id: 'cSkip', label: 'c_skip', values: withoutFinal(diffusion.preconditioning.map((p) => p.cSkip)) },
            { id: 'cOut', label: 'c_out', values: withoutFinal(diffusion.preconditioning.map((p) => p.cOut)) },
            { id: 'cIn', label: 'c_in', values: withoutFinal(diffusion.preconditioning.map((p) => p.cIn)) },
          ]}
          xLabel="step"
          yLabel="value (log)"
          logY
          height={250}
        />
        <p className="figure__note">
          The three span five decades, so the axis is logarithmic. At step 0 the network is asked to
          predict the structure outright — c_skip ≈ 1.6 × 10⁻⁴, c_out = 16. By the last steps c_skip → 1
          and c_out → 0: the denoiser is only nudging coordinates that are already nearly right. The
          33rd level is exactly σ = 0 and is left off, since a log axis has nowhere to put it.
        </p>
      </div>
    )
  }

  if (view === 'trajectory') {
    return (
      <div className="figure">
        <div className="figure__head">
          <span className="figure__title">Radius of gyration</span>
          <span className="figure__sub">measured on the sampled coordinates at every step</span>
        </div>
        <LineChart
          series={[{ id: 'rg', label: 'Rg (Å)', values: diffusion.radiusOfGyration }]}
          xLabel="step"
          yLabel="Å (log)"
          logY
          height={230}
        />
        <p className="figure__note">
          {diffusion.radiusOfGyration[0].toFixed(0)} Å at step 0 down to{' '}
          {diffusion.radiusOfGyration.at(-1)?.toFixed(1)} Å at step{' '}
          {diffusion.radiusOfGyration.length - 1}. A cloud of 1354 atoms collapsing to protein size.
        </p>
      </div>
    )
  }

  return (
    <div className="figure">
      <div className="figure__head">
        <span className="figure__title">Noise schedule</span>
        <span className="figure__sub">
          ρ = {diffusion.rho}, σ_data = {diffusion.sigmaData} Å, σ ∈ [{diffusion.sigmaMin}, {diffusion.sigmaMax}]
        </span>
      </div>
      <LineChart
        series={[{ id: 'sigma', label: 'σ (Å)', values: withoutFinal(diffusion.sigmas) }]}
        xLabel="step"
        yLabel="Å (log)"
        logY
        height={230}
      />
      <p className="figure__note">
        The ρ = 7 spacing packs steps into the low-noise end: the first eight steps cover four fifths of
        the distance, and the rest is spent finishing rather than finding. The 33rd level is exactly
        σ = 0 and is left off the log axis.
      </p>
    </div>
  )
}
