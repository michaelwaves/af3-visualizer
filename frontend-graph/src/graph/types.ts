/** The computational graph: modules as nodes, tensors as edges.
 *
 * The graph is a tree of levels. A node whose `kind` is `group` can be opened,
 * revealing the nodes whose `group` field names it. `port` nodes stand for the
 * tensors crossing a level's boundary, so an opened level still shows where its
 * inputs come from and where its outputs go.
 */

export type NodeKind = 'source' | 'op' | 'group' | 'port' | 'sink'

export interface GraphNode {
  id: string
  label: string
  /** The class or function in the codebase, shown under the label. */
  module: string
  kind: NodeKind
  /** Which level this node lives on. Undefined means the top level. */
  group?: string
  algorithm?: string
  /** Key into `trace.json` and `maps.json` — the real recorded call. */
  traceId?: string
  /** Key into `source.json`. */
  sourceSymbol?: string
  summary: string
  /** Loop annotation, e.g. `×48`. */
  repeats?: string
  /** Which side of an opened level a port sits on. */
  side?: 'in' | 'out'
  detail?: string[]
}

export interface GraphEdge {
  from: string
  to: string
  /** The variable name as the code writes it. */
  tensor: string
  symbolic: string
  concrete?: number[]
  /** Recycling and sampling feedback, drawn dashed and routed backwards. */
  loop?: boolean
}

export interface Level {
  id: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const edgeId = (edge: GraphEdge): string => `${edge.from}→${edge.to}:${edge.tensor}`
