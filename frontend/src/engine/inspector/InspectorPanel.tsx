import { useExplainer, useInspectables } from '../store'
import { ramps } from '../theme'
import { download, toCsv, toJson } from './download'
import { MatrixCanvas } from './MatrixCanvas'
import { Provenance } from './Provenance'

const RAMP_FOR = {
  pair: ramps.pair,
  single: ramps.single,
  attention: ramps.signed,
} as const

/** A drawer over the scene: the numbers behind a picture, and a way to take them. */
export const InspectorPanel = () => {
  const inspectedKey = useExplainer((s) => s.inspectedKey)
  const inspect = useExplainer((s) => s.inspect)
  const tensors = useInspectables()
  if (!inspectedKey) return null

  const tensor = tensors.find((entry) => entry.key === inspectedKey) ?? tensors[0]
  if (!tensor) return null

  const ramp = RAMP_FOR[tensor.provenance?.kind ?? 'pair'] ?? ramps.pair

  return (
    <aside className="inspector">
      <header className="inspector-head">
        <h2>tensor inspector</h2>
        <button onClick={() => inspect(null)} aria-label="Close inspector">
          ✕
        </button>
      </header>

      <nav className="inspector-tabs">
        {tensors.map((entry) => (
          <button
            key={entry.key}
            className={entry.key === tensor.key ? 'inspector-tab inspector-tab-on' : 'inspector-tab'}
            onClick={() => inspect(entry.key)}
          >
            {entry.key}
          </button>
        ))}
      </nav>

      <div className="inspector-body">
        <MatrixCanvas matrix={tensor.matrix} ramp={ramp} />
        <Provenance tensor={tensor} />
      </div>

      <footer className="inspector-actions">
        <button onClick={() => download(`${tensor.key}.csv`, toCsv(tensor.matrix), 'text/csv')}>
          download .csv
        </button>
        <button
          onClick={() => download(`${tensor.key}.json`, toJson(tensor), 'application/json')}
        >
          download .json
        </button>
      </footer>
    </aside>
  )
}
