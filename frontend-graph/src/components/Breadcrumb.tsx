import { level, ROOT, trail } from '@/graph'
import { useGraph, type LabelMode } from '@/store/useGraph'

const MODES: LabelMode[] = ['auto', 'all', 'none']

/** How many tensor names to draw on the wires. */
function LabelToggle() {
  const labels = useGraph((state) => state.labels)
  const setLabels = useGraph((state) => state.setLabels)
  return (
    <span className="crumbs__labels" title="Tensor labels on edges">
      {MODES.map((mode) => (
        <button
          key={mode}
          className={labels === mode ? 'is-active' : ''}
          onClick={() => setLabels(mode)}
        >
          {mode}
        </button>
      ))}
    </span>
  )
}

/** Where in the module tree the canvas currently is. */
export function Breadcrumb() {
  const levelId = useGraph((state) => state.levelId)
  const open = useGraph((state) => state.open)
  const select = useGraph((state) => state.select)
  const goUp = useGraph((state) => state.goUp)

  const crumbs = trail(levelId)
  const current = level(levelId)
  const modules = current.nodes.filter((node) => node.kind !== 'port').length

  return (
    <nav className="crumbs" aria-label="Graph level">
      <button
        className={`crumbs__link ${levelId === ROOT ? 'is-current' : ''}`}
        onClick={() => {
          useGraph.setState({ levelId: ROOT })
          select(null)
        }}
      >
        Alphafold3.forward
      </button>
      {crumbs.map((crumb, index) => (
        <span key={crumb.id} className="crumbs__step">
          <span className="crumbs__sep">›</span>
          <button
            className={`crumbs__link ${index === crumbs.length - 1 ? 'is-current' : ''}`}
            onClick={() => open(crumb.id)}
          >
            {crumb.label}
          </button>
        </span>
      ))}
      <span className="crumbs__count">{modules} modules</span>
      <LabelToggle />
      {levelId !== ROOT && (
        <button className="crumbs__up" onClick={goUp}>
          ↑ up
        </button>
      )}
    </nav>
  )
}
