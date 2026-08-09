import { useEffect, useState } from 'react'
import { loadPayloads } from '@/data/load'
import type { Payloads } from '@/data/types'
import { useWalkthrough } from '@/store/useWalkthrough'
import { CallStack } from '@/components/CallStack'
import { Header } from '@/components/Header'
import { Stage } from '@/components/Stage'
import { Terminal } from '@/components/Terminal'
import { VariablesPanel } from '@/components/VariablesPanel'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

export function App() {
  const payloads = useWalkthrough((state) => state.payloads)
  const setPayloads = useWalkthrough((state) => state.setPayloads)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPayloads()
      .then(setPayloads)
      .catch((reason: Error) => setError(reason.message))
  }, [setPayloads])

  useKeyboardNavigation()

  if (error) return <Failed message={error} />
  if (!payloads) return <Loading />
  return <Walkthrough payloads={payloads} />
}

function Walkthrough({ payloads }: { payloads: Payloads }) {
  return (
    <div className="app">
      <Header meta={payloads.trace.meta} />
      <CallStack />
      <Stage payloads={payloads} />
      <VariablesPanel trace={payloads.trace} />
      <Terminal payloads={payloads} />
    </div>
  )
}

function Loading() {
  return (
    <div className="splash">
      <h1>AlphaFold3 Pytorch Implementation Visualized</h1>
      <p>Loading the recorded forward pass…</p>
    </div>
  )
}

function Failed({ message }: { message: string }) {
  return (
    <div className="splash splash--error">
      <h1>Could not load the capture</h1>
      <p>{message}</p>
      <p className="splash__hint">
        Run <code>python tools/capture_trace.py --output-dir public/data</code> to regenerate the payloads.
      </p>
    </div>
  )
}
