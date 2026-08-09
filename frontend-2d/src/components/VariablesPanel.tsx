import { scopeAt, STEPS } from '@/model/steps'
import type { Trace } from '@/data/types'
import { useWalkthrough } from '@/store/useWalkthrough'
import { ShapeChip } from './ShapeChip'
import { Tooltip } from './Tooltip'
import { formatCount } from '@/lib/format'

/** The right rail: every tensor currently in scope, as a debugger would list it. */
export function VariablesPanel({ trace }: { trace: Trace }) {
  const index = useWalkthrough((state) => state.index)
  const step = STEPS[index]
  const scope = scopeAt(index)
  const recorded = trace.steps.find((entry) => entry.id === step.traceId)

  return (
    <aside className="scope" aria-label="Variables in scope">
      <div className="scope__block">
        <div className="section-label">Variables in play</div>
        <p className="scope__hint">
          {scope.length} live {scope.length === 1 ? 'binding' : 'bindings'} at this point in the pass
        </p>
        <ul className="scope__list">
          {scope.map((variable) => (
            <li key={variable.name} className={`var ${variable.updated ? 'is-updated' : ''}`}>
              <div className="var__head">
                <Tooltip className="var__name" content={<p className="tooltip__body">{variable.description}</p>}>
                  {variable.name}
                </Tooltip>
                {variable.updated && <span className="var__badge">updated</span>}
              </div>
              <ShapeChip symbolic={variable.symbolic} concrete={variable.concrete} />
              {variable.dtype && <span className="var__dtype">{variable.dtype}</span>}
            </li>
          ))}
        </ul>
      </div>

      {recorded && (
        <div className="scope__block">
          <div className="section-label">Recorded call</div>
          <p className="scope__hint">
            <code>{recorded.path}</code>
          </p>
          <dl className="facts">
            <Fact label="class" value={recorded.module} />
            <Fact label="calls this pass" value={String(recorded.calls)} />
            <Fact label="parameters" value={formatCount(recorded.parameters)} />
          </dl>
          <div className="section-label scope__sub">Arguments</div>
          <ul className="scope__list scope__list--compact">
            {recorded.inputs.map((binding, position) => (
              <li key={`${binding.name}-${position}`} className="var var--compact">
                <div className="var__head">
                  <span className="var__name var__name--plain">{binding.name}</span>
                  <span className="var__dtype">{binding.dtype}</span>
                </div>
                {binding.shape.length > 0 && <span className="var__shape">{binding.shape.join(' × ')}</span>}
                {binding.stats && <Stats stats={binding.stats} />}
              </li>
            ))}
          </ul>
          <div className="section-label scope__sub">Returns</div>
          <ul className="scope__list scope__list--compact">
            {recorded.outputs.map((binding, position) => (
              <li key={`${binding.name}-${position}`} className="var var--compact var--out">
                <div className="var__head">
                  <span className="var__name var__name--plain">{binding.name}</span>
                  <span className="var__dtype">{binding.dtype}</span>
                </div>
                {binding.shape.length > 0 && <span className="var__shape">{binding.shape.join(' × ')}</span>}
                {binding.stats && <Stats stats={binding.stats} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

function Stats({ stats }: { stats: NonNullable<Trace['steps'][number]['inputs'][number]['stats']> }) {
  return (
    <div className="stats">
      <span>min {format(stats.min)}</span>
      <span>max {format(stats.max)}</span>
      <span>μ {format(stats.mean)}</span>
      <span>σ {format(stats.std)}</span>
      <span className="stats__count">{formatCount(stats.elements)} el</span>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  )
}

const format = (value: number): string => {
  const magnitude = Math.abs(value)
  if (magnitude !== 0 && (magnitude >= 1e5 || magnitude < 1e-3)) return value.toExponential(1)
  return value.toFixed(3)
}
