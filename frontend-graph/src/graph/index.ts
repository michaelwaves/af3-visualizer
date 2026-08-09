import type { GraphEdge, GraphNode, Level } from './types'
import { rootSourceNodes } from './levels/root'
import { rootModuleNodes } from './levels/root-modules'
import { rootEdges } from './levels/root-edges'
import { embedEdges, embedNodes } from './levels/embed'
import { trunkEdges, trunkNodes } from './levels/trunk'
import { templateEdges, templateNodes } from './levels/template'
import { msaEdges, msaNodes } from './levels/msa'
import {
  pairformerEdges,
  pairformerNodes,
  pairwiseBlockEdges,
  pairwiseBlockNodes,
} from './levels/pairformer'
import { edmEdges, edmNodes } from './levels/diffusion'
import { denoiserEdges, denoiserNodes } from './levels/denoiser'
import { headEdges, headNodes } from './levels/heads'

export const ROOT = 'root'

const LEVELS: Level[] = [
  { id: ROOT, nodes: [...rootSourceNodes, ...rootModuleNodes], edges: rootEdges },
  { id: 'input_embedder', nodes: embedNodes, edges: embedEdges },
  { id: 'trunk', nodes: trunkNodes, edges: trunkEdges },
  { id: 'template_embedder', nodes: templateNodes, edges: templateEdges },
  { id: 'msa_module', nodes: msaNodes, edges: msaEdges },
  { id: 'pairformer', nodes: pairformerNodes, edges: pairformerEdges },
  { id: 'pairformer_block', nodes: pairwiseBlockNodes, edges: pairwiseBlockEdges },
  { id: 'edm', nodes: edmNodes, edges: edmEdges },
  { id: 'diffusion_module', nodes: denoiserNodes, edges: denoiserEdges },
  { id: 'confidence_head', nodes: headNodes, edges: headEdges },
]

const BY_ID = new Map(LEVELS.map((level) => [level.id, level]))

export const ALL_NODES: GraphNode[] = LEVELS.flatMap((level) => level.nodes)
export const ALL_EDGES: GraphEdge[] = LEVELS.flatMap((level) => level.edges)

const NODE_BY_ID = new Map(ALL_NODES.map((node) => [node.id, node]))

export const level = (id: string): Level => BY_ID.get(id) ?? BY_ID.get(ROOT)!
export const node = (id: string): GraphNode | undefined => NODE_BY_ID.get(id)
export const hasLevel = (id: string): boolean => BY_ID.has(id)

/** The chain of levels from the root down to `id`, for the breadcrumb. */
export function trail(id: string): GraphNode[] {
  const crumbs: GraphNode[] = []
  let current = id
  while (current !== ROOT) {
    const entry = node(current)
    if (!entry) break
    crumbs.unshift(entry)
    current = entry.group ?? ROOT
  }
  return crumbs
}

/** Every module in the graph that maps onto a recorded call. */
export const recordedNodes = (): GraphNode[] => ALL_NODES.filter((entry) => entry.traceId)
