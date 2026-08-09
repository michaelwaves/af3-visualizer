import { useState } from 'react'
import type { Payloads } from '@/data/types'
import { hasLevel, node } from '@/graph'
import { useGraph } from '@/store/useGraph'
import { Prose } from '@/components/Prose'
import { ShapeChip } from '@/components/ShapeChip'
import { ActivationView } from './ActivationView'
import { CodeView } from './CodeView'
import { Signature } from './Signature'
import { Neighbours } from './Neighbours'

type Tab = 'about' | 'io' | 'code' | 'activation'

/** The drawer that opens when a node is clicked. */
export function Inspector({ payloads }: { payloads: Payloads }) {
  const selectedId = useGraph((state) => state.selectedId)
  const select = useGraph((state) => state.select)
  const open = useGraph((state) => state.open)
  const [tab, setTab] = useState<Tab>('about')

  const entry = selectedId ? node(selectedId) : undefined
  if (!entry) {
    return (
      <aside className="drawer drawer--idle">
        <p className="drawer__hint">
          Click a node to inspect it. Nodes with a filled dot were recorded in the real forward pass;
          nodes marked <span className="chip-inline">open ↳</span> contain a sub-graph.
        </p>
      </aside>
    )
  }

  const recorded = payloads.trace.steps.find((step) => step.id === entry.traceId)
  const map = entry.traceId ? payloads.maps[entry.traceId] : undefined
  const tabs: Tab[] = ['about']
  if (recorded) tabs.push('io')
  if (entry.sourceSymbol && payloads.source.snippets[entry.sourceSymbol]) tabs.push('code')
  if (map) tabs.push('activation')
  const active = tabs.includes(tab) ? tab : 'about'

  return (
    <aside className="drawer">
      <header className="drawer__head">
        <div>
          <h2 className="drawer__title">{entry.label}</h2>
          <code className="drawer__module">{entry.module}</code>
        </div>
        <button className="drawer__close" onClick={() => select(null)} aria-label="Close">
          ×
        </button>
      </header>

      <div className="drawer__badges">
        {entry.algorithm && <span className="badge badge--algo">{entry.algorithm}</span>}
        {entry.repeats && <span className="badge">{entry.repeats}</span>}
        {entry.kind === 'port' && <span className="badge">boundary tensor</span>}
        {hasLevel(entry.id) && (
          <button className="badge badge--open" onClick={() => open(entry.id)}>
            open sub-graph ↳
          </button>
        )}
      </div>

      <p className="drawer__summary">{entry.summary}</p>

      <div className="tabs" role="tablist">
        {tabs.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            className={`tabs__tab ${active === id ? 'is-active' : ''}`}
            onClick={() => setTab(id)}
          >
            {LABELS[id]}
          </button>
        ))}
      </div>

      <div className="drawer__body">
        {active === 'about' && (
          <>
            {entry.detail && <Prose paragraphs={entry.detail} />}
            {entry.kind === 'port' && <ShapeChip symbolic={entry.module} />}
            <Neighbours nodeId={entry.id} />
          </>
        )}
        {active === 'io' && recorded && <Signature recorded={recorded} />}
        {active === 'code' && entry.sourceSymbol && (
          <CodeView symbol={entry.sourceSymbol} source={payloads.source} />
        )}
        {active === 'activation' && entry.traceId && map && (
          <ActivationView traceId={entry.traceId} map={map} />
        )}
      </div>
    </aside>
  )
}

const LABELS: Record<Tab, string> = {
  about: 'About',
  io: 'Tensors',
  code: 'Code',
  activation: 'Activation',
}
