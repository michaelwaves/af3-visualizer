import type { TraceStep } from '@/data/types'
import { formatCount, formatNumber } from '@/lib/format'

/** The real call the capture recorded: arguments in, values out, with statistics. */
export function Signature({ recorded }: { recorded: TraceStep }) {
  return (
    <div className="signature">
      <dl className="facts">
        <dt>class</dt>
        <dd>{recorded.module}</dd>
        <dt>hooked at</dt>
        <dd>
          <code>{recorded.path}</code>
        </dd>
        <dt>calls this pass</dt>
        <dd>{recorded.calls}</dd>
        <dt>parameters</dt>
        <dd>{formatCount(recorded.parameters)}</dd>
      </dl>
      <Bindings title="Arguments" bindings={recorded.inputs} />
      <Bindings title="Returns" bindings={recorded.outputs} />
    </div>
  )
}

function Bindings({ title, bindings }: { title: string; bindings: TraceStep['inputs'] }) {
  if (!bindings.length) return null
  return (
    <>
      <div className="section-label section-label--spaced">{title}</div>
      <ul className="bindings">
        {bindings.map((binding, index) => (
          <li key={`${binding.name}-${index}`} className="binding">
            <div className="binding__head">
              <span className="binding__name">{binding.name}</span>
              <span className="binding__dtype">{binding.dtype}</span>
            </div>
            {binding.shape.length > 0 && (
              <span className="binding__shape">{binding.shape.join(' × ')}</span>
            )}
            {binding.stats && (
              <div className="binding__stats">
                <span>min {formatNumber(binding.stats.min)}</span>
                <span>max {formatNumber(binding.stats.max)}</span>
                <span>μ {formatNumber(binding.stats.mean)}</span>
                <span>σ {formatNumber(binding.stats.std)}</span>
                <span className="binding__count">{formatCount(binding.stats.elements)} el</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
