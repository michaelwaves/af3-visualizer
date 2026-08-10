import type { DiagramNode } from './types'

/** Arrowheads and swatch gradients, declared once for the whole diagram. */
export const DiagramDefs = ({ nodes }: { nodes: DiagramNode[] }) => (
  <defs>
    {(['input', 'trunk', 'sample'] as const).map((role) => (
      <marker
        key={role}
        id={`arrow-${role}`}
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="4.5"
        markerHeight="4.5"
        orient="auto-start-reverse"
      >
        <path className={`diagram-head diagram-head-${role}`} d="M0,1 L7,4 L0,7 z" />
      </marker>
    ))}
    {nodes
      .filter((node) => node.swatch)
      .map((node) => (
        <linearGradient key={node.id} id={`swatch-${node.id}`} x1="0" x2="1" y1="0" y2="0">
          {node.swatch!.map((stop, index, all) => (
            <stop key={stop} offset={index / (all.length - 1)} stopColor={stop} />
          ))}
        </linearGradient>
      ))}
  </defs>
)
