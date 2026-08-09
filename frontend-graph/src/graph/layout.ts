import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { GraphEdge, GraphNode } from './types'
import { edgeId } from './types'

export const NODE_WIDTH = 236
export const NODE_HEIGHT = 74
const PORT_WIDTH = 150
const PORT_HEIGHT = 44

/** Runs dagre over one level and hands React Flow positioned nodes and edges. */
export function layout(nodes: GraphNode[], edges: GraphEdge[]): { nodes: Node[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph()
  // Top to bottom: these levels are mostly chains, and a chain laid out left to
  // right becomes a thin strip in a tall viewport, too small to read.
  graph.setGraph({ rankdir: 'TB', nodesep: 30, ranksep: 76, marginx: 24, marginy: 24 })
  graph.setDefaultEdgeLabel(() => ({}))

  nodes.forEach((node) => graph.setNode(node.id, sizeOf(node)))
  // Feedback edges are laid out forwards, then drawn backwards, so dagre keeps
  // the pipeline in reading order instead of folding it around the loop.
  edges.filter((edge) => !edge.loop).forEach((edge) => graph.setEdge(edge.from, edge.to))
  dagre.layout(graph)

  return {
    nodes: nodes.map((node) => {
      const placed = graph.node(node.id)
      const { width, height } = sizeOf(node)
      return {
        id: node.id,
        type: node.kind === 'port' ? 'port' : 'module',
        position: { x: placed.x - width / 2, y: placed.y - height / 2 },
        data: { node } as unknown as Record<string, unknown>,
        draggable: false,
      }
    }),
    edges: edges.map((edge) => ({
      id: edgeId(edge),
      source: edge.from,
      target: edge.to,
      type: 'tensor',
      animated: false,
      data: { edge } as unknown as Record<string, unknown>,
    })),
  }
}

function sizeOf(node: GraphNode): { width: number; height: number } {
  return node.kind === 'port'
    ? { width: PORT_WIDTH, height: PORT_HEIGHT }
    : { width: NODE_WIDTH, height: NODE_HEIGHT }
}
