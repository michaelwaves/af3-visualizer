import { useEffect, useState } from 'react'
import { InspectorPanel } from './inspector/InspectorPanel'
import { AxisLegend } from './narrative/AxisLegend'
import { NarrativePanel } from './narrative/NarrativePanel'
import { ArchitectureMap } from './narrative/ArchitectureMap'
import { PipelineMap } from './narrative/PipelineMap'
import { RawInputsPanel } from './reference/RawInputsPanel'
import { ReferencePanel } from './reference/ReferencePanel'
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
  const referenceOpen = useExplainer((s) => s.referenceOpen)
  const toggleReference = useExplainer((s) => s.toggleReference)
  const rawInputsOpen = useExplainer((s) => s.rawInputsOpen)
  const toggleRawInputs = useExplainer((s) => s.toggleRawInputs)
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
      {pack.diagram ? <ArchitectureMap /> : <PipelineMap />}

      <NarrativePanel />

      <div className="stage">
        <SceneCanvas />
        <AxisLegend />
        <InspectorPanel />
        <ReferencePanel />
        <RawInputsPanel />
        <div className="stage-tools">
          <button onClick={toggleRawInputs}>{rawInputsOpen ? 'close' : 'files'}</button>
          <button onClick={toggleReference}>{referenceOpen ? 'close' : 'maths & code'}</button>
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
