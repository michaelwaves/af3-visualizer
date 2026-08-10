/** A hand-laid architecture diagram a pack can supply instead of a linear rail.
 *
 * The engine knows how to draw these shapes and route these wires; it does not
 * know what any of them mean. All coordinates are in the diagram's own viewBox.
 */

export type NodeShape = 'box' | 'cylinder' | 'chip' | 'swatch' | 'junction'

/** Wires are coloured by role, matching the figure they are drawn from. */
export type WireRole = 'input' | 'trunk' | 'sample'

export interface DiagramNode {
  id: string
  shape: NodeShape
  x: number
  y: number
  width: number
  height: number
  label?: string
  /** Second line, e.g. `(48 blocks)`. */
  sub?: string
  /** Pipeline stage this node stands for; clicking it jumps there. */
  stage?: string
  /** Shown on hover when the node has no stage of its own. */
  note?: string
  /** Gradient stops for `swatch` nodes, low to high. Two or more. */
  swatch?: string[]
  /** Caption drawn beside the node rather than inside it. */
  caption?: { text: string; x: number; y: number; anchor?: 'start' | 'middle' | 'end' }
}

export interface DiagramWire {
  d: string
  role: WireRole
  dashed?: boolean
  /** Draw an arrowhead at the end of the path. Defaults to true. */
  head?: boolean
}

export interface DiagramLabel {
  text: string
  x: number
  y: number
  role?: WireRole
  anchor?: 'start' | 'middle' | 'end'
  /** Renders smaller and dimmer — for axis ticks and scale ends. */
  faint?: boolean
}

export interface ArchitectureDiagram {
  /** Width and height of the coordinate space the geometry is written in. */
  viewBox: [number, number]
  nodes: DiagramNode[]
  wires: DiagramWire[]
  labels: DiagramLabel[]
  /** One line under the diagram, e.g. what the dashed loops mean. */
  caption?: string
}
