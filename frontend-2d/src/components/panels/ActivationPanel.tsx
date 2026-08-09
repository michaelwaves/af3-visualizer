import type { ActivationMap, TraceStep } from '@/data/types'
import { Heatmap } from '../Heatmap'
import type { Step } from '@/model/types'
import { formatCount, formatNumber } from '@/lib/format'

interface ActivationPanelProps {
  step: Step
  map?: ActivationMap
  recorded?: TraceStep
}

/** The real tensor this module produced, reduced to something paintable. */
export function ActivationPanel({ step, map, recorded }: ActivationPanelProps) {
  if (!map || !recorded) {
    return (
      <p className="panel__empty">
        Nothing was recorded here — this step is featurisation or control flow rather than a module
        with weights. Steps that were hooked show a live map.
      </p>
    )
  }

  const stats = recorded.outputs.find((binding) => binding.stats)?.stats
  const signed = map.min < 0 && map.max > 0

  return (
    <div className="activation">
      <Heatmap map={map} ramp={signed ? 'tide' : 'ocean'} />
      <dl className="facts facts--wide">
        <dt>tensor</dt>
        <dd>{map.fullShape.join(' × ')}</dd>
        <dt>drawn as</dt>
        <dd>
          {map.rows} × {map.cols} — {map.reduction}
        </dd>
        {stats && (
          <>
            <dt>range</dt>
            <dd>
              {formatNumber(stats.min)} … {formatNumber(stats.max)}
            </dd>
            <dt>mean ± std</dt>
            <dd>
              {formatNumber(stats.mean)} ± {formatNumber(stats.std)}
            </dd>
            <dt>elements</dt>
            <dd>{formatCount(stats.elements)}</dd>
            {stats.zeroFraction !== undefined && (
              <>
                <dt>exactly zero</dt>
                <dd>{(stats.zeroFraction * 100).toFixed(1)} %</dd>
              </>
            )}
          </>
        )}
        <dt>hooked at</dt>
        <dd>
          <code>{recorded.path}</code>
        </dd>
      </dl>
      <p className="activation__note">
        Statistics describe the full {map.fullShape.join(' × ')} tensor. The picture is the reduction
        named above — {step.module} produces more channels than a flat image can hold.
      </p>
    </div>
  )
}
