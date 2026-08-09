import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import type { GraphEdge } from '@/graph/types'
import { useGraph } from '@/store/useGraph'

/** An edge carrying a named tensor, labelled with its einops shape. */
export function TensorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const edge = (data as { edge: GraphEdge } | undefined)?.edge
  const selectedId = useGraph((state) => state.selectedId)
  const labels = useGraph((state) => state.labels)

  // Labelling every wire turns a dense level into noise, so by default only the
  // selected node's wires are named.
  const touched = !!edge && (edge.from === selectedId || edge.to === selectedId)
  const showLabel = labels === 'all' || (labels === 'auto' && touched)
  const faded = labels === 'auto' && selectedId !== null && !touched

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.28,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={`edge ${edge?.loop ? 'edge--loop' : ''} ${touched ? 'edge--lit' : ''} ${
          faded ? 'edge--faded' : ''
        }`}
        markerEnd="url(#tensor-arrow)"
      />
      {edge && showLabel && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label ${edge.loop ? 'edge-label--loop' : ''}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            <span className="edge-label__tensor">{edge.tensor}</span>
            <span className="edge-label__shape">{edge.symbolic}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

/** The single arrowhead every edge reuses. */
export function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <marker
          id="tensor-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--sky-400)" />
        </marker>
      </defs>
    </svg>
  )
}
