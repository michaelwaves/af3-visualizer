import { useEffect, useState } from 'react'
import { AxisLegend } from './narrative/AxisLegend'
import { NarrativePanel } from './narrative/NarrativePanel'
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
        <AxisLegend />
        <button className="look-toggle" onClick={toggleFreeLook}>
          {freeLook ? 'guided camera' : 'free look'}
        </button>
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

const Splash = ({ message }: { message: string }) => (
  <div className="splash">
    <span>{message}</span>
  </div>
)
