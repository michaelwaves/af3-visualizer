import type { DiagramNode } from './types'

interface Props {
  node: DiagramNode
  active: boolean
  clickable: boolean
  onSelect: () => void
  onHover: (node: DiagramNode | null) => void
}

/** One shape on the diagram: a box, a database cylinder, a chip or a swatch. */
export const DiagramNodeShape = ({ node, active, clickable, onSelect, onHover }: Props) => {
  const classes = ['diagram-node', `diagram-node-${node.shape}`]
  if (active) classes.push('diagram-node-active')
  if (clickable) classes.push('diagram-node-clickable')

  return (
    <g
      className={classes.join(' ')}
      data-id={node.id}
      onClick={clickable ? onSelect : undefined}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
    >
      {node.shape === 'cylinder' && <Cylinder node={node} />}
      {node.shape === 'junction' && <Junction node={node} />}
      {node.shape !== 'cylinder' && node.shape !== 'junction' && <Rect node={node} />}
      {node.label && <Text node={node} />}
      {node.caption && (
        <text
          className="diagram-caption"
          x={node.caption.x}
          y={node.caption.y}
          textAnchor={node.caption.anchor ?? 'middle'}
        >
          {node.caption.text}
        </text>
      )}
    </g>
  )
}

const Rect = ({ node }: { node: DiagramNode }) => (
  <rect
    className="diagram-shape"
    x={node.x}
    y={node.y}
    width={node.width}
    height={node.height}
    rx={node.shape === 'chip' ? node.height / 2 : node.shape === 'swatch' ? 2 : 4}
    style={node.swatch ? { fill: `url(#swatch-${node.id})` } : undefined}
  />
)

/** A database, drawn the way every architecture figure draws one. */
const Cylinder = ({ node }: { node: DiagramNode }) => {
  const lip = 6
  const { x, y, width: w, height: h } = node
  return (
    <>
      <path
        className="diagram-shape"
        d={`M${x},${y + lip} a${w / 2},${lip} 0 0 1 ${w},0 v${h - lip * 2} a${w / 2},${lip} 0 0 1 ${-w},0 z`}
      />
      <path
        className="diagram-shape diagram-shape-lip"
        d={`M${x},${y + lip} a${w / 2},${lip} 0 0 0 ${w},0`}
        fill="none"
      />
    </>
  )
}

/** The ⊕ where a residual branch is added back into a stream. */
const Junction = ({ node }: { node: DiagramNode }) => {
  const cx = node.x + node.width / 2
  const cy = node.y + node.height / 2
  const arm = node.width / 2 - 3
  return (
    <>
      <circle className="diagram-shape" cx={cx} cy={cy} r={node.width / 2} />
      <path className="diagram-plus" d={`M${cx - arm},${cy} H${cx + arm} M${cx},${cy - arm} V${cy + arm}`} />
    </>
  )
}

const Text = ({ node }: { node: DiagramNode }) => {
  const middle = node.x + node.width / 2
  // A cylinder's visual centre sits below its geometric one, under the lip.
  const centre = node.y + node.height / 2 + (node.shape === 'cylinder' ? 3 : 0)
  const tall = node.height > node.width * 1.6

  // A tall, narrow box reads better with its label rotated up the box.
  if (tall) {
    return (
      <text className="diagram-label" transform={`translate(${middle},${centre}) rotate(-90)`}>
        <tspan x={0} dy={-2}>
          {node.label}
        </tspan>
        {node.sub && (
          <tspan className="diagram-sub" x={0} dy={11}>
            {node.sub}
          </tspan>
        )}
      </text>
    )
  }

  return (
    <text className="diagram-label" x={middle} y={node.sub ? centre - 3 : centre + 3}>
      <tspan x={middle}>{node.label}</tspan>
      {node.sub && (
        <tspan className="diagram-sub" x={middle} dy={12}>
          {node.sub}
        </tspan>
      )}
    </text>
  )
}
