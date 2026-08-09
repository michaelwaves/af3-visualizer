import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GraphNode } from '@/graph/types'
import { useGraph } from '@/store/useGraph'

/** One module on the canvas. Minimal by default; details live in the drawer. */
export function ModuleNode({ data, id }: NodeProps) {
  const node = (data as { node: GraphNode }).node
  const selected = useGraph((state) => state.selectedId) === id
  const open = useGraph((state) => state.open)
  const isGroup = node.kind === 'group'

  return (
    <div
      className={`node node--${node.kind} ${selected ? 'is-selected' : ''}`}
      onDoubleClick={() => isGroup && open(node.id)}
      title={isGroup ? 'Double-click to open' : undefined}
    >
      <Handle type="target" position={Position.Top} className="node__handle" />
      <div className="node__head">
        <span className="node__label" title={node.label}>{node.label}</span>
        {node.algorithm && (
          <span className="node__algo">{node.algorithm.replace('Algorithm ', 'Alg ')}</span>
        )}
      </div>
      <div className="node__foot">
        <span className="node__module" title={node.module}>{node.module}</span>
        {node.repeats && <span className="node__repeat">{node.repeats}</span>}
        {node.traceId && <span className="node__dot" title="recorded in the capture" />}
        {isGroup && (
          <button
            className="node__open"
            onClick={(event) => {
              event.stopPropagation()
              open(node.id)
            }}
          >
            open ↳
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="node__handle" />
    </div>
  )
}

/** A tensor crossing the boundary of the level currently on screen. */
export function PortNode({ data }: NodeProps) {
  const node = (data as { node: GraphNode }).node
  return (
    <div className={`port port--${node.side}`}>
      <Handle type="target" position={Position.Top} className="node__handle" />
      <span className="port__name">{node.label}</span>
      <span className="port__shape">{node.module}</span>
      <Handle type="source" position={Position.Bottom} className="node__handle" />
    </div>
  )
}
