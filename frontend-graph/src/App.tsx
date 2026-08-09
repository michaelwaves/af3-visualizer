import { useEffect, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { loadPayloads } from '@/data/load'
import { useGraph } from '@/store/useGraph'
import { Canvas } from '@/canvas/Canvas'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Header } from '@/components/Header'
import { Inspector } from '@/inspector/Inspector'
import { ProvenanceBar } from '@/components/ProvenanceBar'

export function App() {
  const payloads = useGraph((state) => state.payloads)
  const setPayloads = useGraph((state) => state.setPayloads)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPayloads()
      .then(setPayloads)
      .catch((reason: Error) => setError(reason.message))
  }, [setPayloads])

  if (error) return <Splash title="Could not load the capture" message={error} />
  if (!payloads) return <Splash title="AlphaFold3 Pytorch Implementation Visualized" message="Loading the recorded forward pass…" />

  return (
    <div className="app">
      <Header meta={payloads.trace.meta} />
      <Breadcrumb />
      <ReactFlowProvider>
        <Canvas />
      </ReactFlowProvider>
      <Inspector payloads={payloads} />
      <ProvenanceBar meta={payloads.trace.meta} source={payloads.source} />
    </div>
  )
}

function Splash({ title, message }: { title: string; message: string }) {
  return (
    <div className="splash">
      <h1>{title}</h1>
      <p>{message}</p>
    </div>
  )
}
