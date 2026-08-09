import { useEffect, useMemo } from 'react'
import { Background, BackgroundVariant, Controls, ReactFlow, useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { level } from '@/graph'
import { layout } from '@/graph/layout'
import { useGraph } from '@/store/useGraph'
import { EdgeMarkers, TensorEdge } from './TensorEdge'
import { ModuleNode, PortNode } from './ModuleNode'

const nodeTypes = { module: ModuleNode, port: PortNode }
const edgeTypes = { tensor: TensorEdge }

/** The graph itself: one level at a time, laid out left to right. */
export function Canvas() {
  const levelId = useGraph((state) => state.levelId)
  const select = useGraph((state) => state.select)
  const open = useGraph((state) => state.open)

  const current = level(levelId)
  const { nodes, edges } = useMemo(() => layout(current.nodes, current.edges), [current])

  return (
    <div className="canvas">
      <EdgeMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_event, node) => select(node.id)}
        onNodeDoubleClick={(_event, node) => open(node.id)}
        onPaneClick={() => select(null)}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={1.8}
        nodesConnectable={false}
        elementsSelectable
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--fog-300)" />
        <Controls showInteractive={false} position="bottom-right" />
        <FitOnLevelChange levelId={levelId} />
      </ReactFlow>
    </div>
  )
}

/** Re-frames the viewport whenever the level changes, so a drill-down lands well. */
function FitOnLevelChange({ levelId }: { levelId: string }) {
  const flow = useReactFlow()
  useEffect(() => {
    const timer = window.setTimeout(() => flow.fitView({ padding: 0.14, maxZoom: 1, duration: 320 }), 40)
    return () => window.clearTimeout(timer)
  }, [levelId, flow])
  return null
}
