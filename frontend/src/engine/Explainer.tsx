import { useEffect, useState } from 'react'
import { InspectorPanel } from './inspector/InspectorPanel'
import { AxisLegend } from './narrative/AxisLegend'
import { NarrativePanel } from './narrative/NarrativePanel'
import { PipelineMap } from './narrative/PipelineMap'
import { SceneCanvas } from './scene/SceneCanvas'
import { useExplainer } from './store'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import type { ModelPack } from './types'

/**
 * The whole app, for any pack: prose on the left, a live 3D scene on the right.
 * Nothing here knows what AlphaFold is — swap the pack and the shell still works.
 */
export const Explainer = ({ pack }: { pack: ModelPack }) => {
  const loadPack = useExplainer((s) => s.loadPack)
  const freeLook = useExplainer((s) => s.freeLook)
  const toggleFreeLook = useExplainer((s) => s.toggleFreeLook)
  const inspectedKey = useExplainer((s) => s.inspectedKey)
  const inspect = useExplainer((s) => s.inspect)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  useKeyboardNavigation()

  useEffect(() => {
    fetchPackData(pack)
      .then((data) => {
        loadPack(pack, data)
        setStatus('ready')
      })
      .catch(() => setStatus('failed'))
  }, [pack, loadPack])

  if (status === 'loading') return <Splash message="loading tensors…" />
  if (status === 'failed') return <Splash message="could not load model data — run the extractor first" />

  return (
    <main className="explainer">
      <header className="masthead">
        <h1>{pack.title}</h1>
        <span className="masthead-sub">{pack.subtitle}</span>
        <a className="masthead-link" href={pack.source.href} target="_blank" rel="noreferrer">
          {pack.source.label} ↗
        </a>
      </header>

      <NarrativePanel />

      <div className="stage">
        <SceneCanvas />
        <PipelineMap />
        <AxisLegend />
        <InspectorPanel />
        <div className="stage-tools">
          <button onClick={() => inspect(inspectedKey ? null : firstInspectable(pack))}>
            {inspectedKey ? 'close tensors' : 'inspect tensors'}
          </button>
          <button onClick={toggleFreeLook}>{freeLook ? 'guided camera' : 'free look'}</button>
        </div>
      </div>
    </main>
  )
}

const fetchPackData = async (pack: ModelPack): Promise<Record<string, unknown>> => {
  const entries = await Promise.all(
    Object.entries(pack.data).map(async ([key, url]) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`missing data: ${url}`)
      return [key, await response.json()] as const
    }),
  )
  return Object.fromEntries(entries)
}

/** Opening the inspector lands on the first tensor the pack exposes. */
const firstInspectable = (pack: ModelPack): string | null =>
  pack.inspectables(useExplainer.getState().data)[0]?.key ?? null

const Splash = ({ message }: { message: string }) => (
  <div className="splash">
    <span>{message}</span>
  </div>
)
