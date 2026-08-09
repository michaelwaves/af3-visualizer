import { useEffect, useRef } from 'react'
import type { Payloads } from '@/data/types'
import { inlineCode, Prose } from './Prose'
import { STEPS } from '@/model/steps'
import { STAGES, type Step } from '@/model/types'
import { STEPS_WITH_DATA } from '@/model/figures'
import { useWalkthrough, type PanelTab } from '@/store/useWalkthrough'
import { ActivationPanel } from './panels/ActivationPanel'
import { CodePanel } from './panels/CodePanel'
import { DataPanel } from './panels/DataPanel'
import { MathPanel } from './panels/MathPanel'
import { ProvenanceNote } from './ProvenanceNote'
import { TensorPanel } from './panels/TensorPanel'
import { TensorFlow } from './TensorFlow'

const LABELS: Record<PanelTab, string> = {
  math: 'Math',
  code: 'Code',
  activation: 'Activations',
  data: 'Measured data',
  tensor: 'Raw tensor',
}

/** Only offer the panels that have something in them for this step. */
function availableTabs(step: Step, payloads: Payloads): PanelTab[] {
  const tabs: PanelTab[] = []
  if (step.math?.length) tabs.push('math')
  if (step.sourceSymbol && payloads.source.snippets[step.sourceSymbol]) tabs.push('code')
  if (step.traceId && payloads.maps[step.traceId]) tabs.push('activation')
  if (STEPS_WITH_DATA.has(step.id)) tabs.push('data')
  if (step.traceId) tabs.push('tensor')
  return tabs
}

/** The centre column: where we are, what happens here, and the four panels. */
export function Stage({ payloads }: { payloads: Payloads }) {
  const index = useWalkthrough((state) => state.index)
  const tab = useWalkthrough((state) => state.tab)
  const setTab = useWalkthrough((state) => state.setTab)
  const advance = useWalkthrough((state) => state.advance)

  const step = STEPS[index]
  const stage = STAGES.find((entry) => entry.id === step.stage)
  const recorded = payloads.trace.steps.find((entry) => entry.id === step.traceId)
  const map = step.traceId ? payloads.maps[step.traceId] : undefined
  const tabs = availableTabs(step, payloads)
  const active = tabs.includes(tab) ? tab : tabs[0]
  const scroller = useRef<HTMLElement>(null)

  // A debugger lands you at the top of the new frame, not where you were reading.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [index])

  return (
    <main className="stage" ref={scroller}>
      <div className="stage__inner">
        <div className="crumb">
          <span className="crumb__stage">{stage?.label}</span>
          <span className="crumb__sep">/</span>
          <span className="crumb__step">
            step {index + 1} of {STEPS.length}
          </span>
          {step.repeats && <span className="crumb__loop">{step.repeats}</span>}
        </div>

        <h2 className="stage__title">{step.title}</h2>
        <div className="stage__meta">
          <code className="stage__module">{step.module}</code>
          {step.algorithm && <span className="badge badge--algo">{step.algorithm}</span>}
          {recorded && <span className="badge">{recorded.calls}× this pass</span>}
        </div>
        <p className="stage__summary">{inlineCode(step.summary)}</p>

        <TensorFlow inputs={step.inputs} outputs={step.outputs} />

        <Prose paragraphs={step.detail} />

        {tabs.length > 0 && (
          <section className="panel panel--tabs">
            <div className="tabs" role="tablist">
              {tabs.map((entry) => (
                <button
                  key={entry}
                  role="tab"
                  aria-selected={active === entry}
                  className={`tabs__tab ${active === entry ? 'is-active' : ''}`}
                  onClick={() => setTab(entry)}
                >
                  {LABELS[entry]}
                </button>
              ))}
            </div>
            <div className="panel__body">
              {active === 'math' && <MathPanel step={step} />}
              {active === 'code' && <CodePanel step={step} source={payloads.source} />}
              {active === 'activation' && <ActivationPanel step={step} map={map} recorded={recorded} />}
              {active === 'data' && <DataPanel step={step} payloads={payloads} />}
              {active === 'tensor' && <TensorPanel step={step} />}
            </div>
          </section>
        )}

        <nav className="stepper">
          <button className="stepper__button" onClick={() => advance(-1)} disabled={index === 0}>
            ← {STEPS[index - 1]?.title ?? 'start'}
          </button>
          <button
            className="stepper__button stepper__button--next"
            onClick={() => advance(1)}
            disabled={index === STEPS.length - 1}
          >
            {STEPS[index + 1]?.title ?? 'end'} →
          </button>
        </nav>

        <ProvenanceNote meta={payloads.trace.meta} source={payloads.source} />
      </div>
    </main>
  )
}
