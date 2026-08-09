import { ALL_EDGES, node } from '@/graph'
import type { GraphEdge } from '@/graph/types'
import { ShapeChip } from '@/components/ShapeChip'
import { useGraph } from '@/store/useGraph'

/** What flows into this node and what flows out, as a clickable list. */
export function Neighbours({ nodeId }: { nodeId: string }) {
  const incoming = ALL_EDGES.filter((edge) => edge.to === nodeId)
  const outgoing = ALL_EDGES.filter((edge) => edge.from === nodeId)
  if (!incoming.length && !outgoing.length) return null

  return (
    <div className="neighbours">
      <Wires title="Consumes" edges={incoming} endpoint="from" />
      <Wires title="Produces" edges={outgoing} endpoint="to" />
    </div>
  )
}

function Wires({
  title,
  edges,
  endpoint,
}: {
  title: string
  edges: GraphEdge[]
  endpoint: 'from' | 'to'
}) {
  const open = useGraph((state) => state.open)
  if (!edges.length) return null

  return (
    <>
      <div className="section-label section-label--spaced">{title}</div>
      <ul className="wires">
        {edges.map((edge) => {
          const other = node(edge[endpoint])
          return (
            <li key={`${edge.from}-${edge.to}-${edge.tensor}`} className="wire">
              <button className="wire__peer" onClick={() => other && open(other.id)}>
                {endpoint === 'from' ? '←' : '→'} {other?.label ?? edge[endpoint]}
              </button>
              <span className="wire__tensor">{edge.tensor}</span>
              <ShapeChip symbolic={edge.symbolic} concrete={edge.concrete} />
            </li>
          )
        })}
      </ul>
    </>
  )
}
