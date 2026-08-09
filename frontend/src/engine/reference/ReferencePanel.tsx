import { useState } from 'react'
import { useActiveChapter, useExplainer, usePackData } from '../store'
import type { SourceIndex } from '../types'
import { CodeBlock } from './CodeBlock'
import { MathBlock } from './MathBlock'

type Tab = 'math' | 'code'

/** The equation and the implementation for whatever chapter is on screen. */
export const ReferencePanel = () => {
  const chapter = useActiveChapter()
  const pack = useExplainer((s) => s.pack)
  const open = useExplainer((s) => s.referenceOpen)
  const toggle = useExplainer((s) => s.toggleReference)
  const source = usePackData<SourceIndex>('source')
  const [tab, setTab] = useState<Tab>('math')

  if (!open || !chapter || !pack) return null
  const reference = pack.reference[chapter.id]
  const equations = reference?.equations ?? []
  const snippets = (reference?.snippets ?? [])
    .map((key) => source?.snippets[key])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

  return (
    <aside className="reference">
      <header className="reference-head">
        <h2>{chapter.title.toLowerCase()}</h2>
        <button onClick={toggle} aria-label="Close reference">
          ✕
        </button>
      </header>

      <nav className="reference-tabs">
        <button
          className={tab === 'math' ? 'reference-tab reference-tab-on' : 'reference-tab'}
          onClick={() => setTab('math')}
        >
          maths ({equations.length})
        </button>
        <button
          className={tab === 'code' ? 'reference-tab reference-tab-on' : 'reference-tab'}
          onClick={() => setTab('code')}
        >
          code ({snippets.length})
        </button>
      </nav>

      <div className="reference-body">
        {tab === 'math' &&
          (equations.length ? (
            equations.map((equation) => <MathBlock key={equation.label} equation={equation} />)
          ) : (
            <p className="reference-empty">No equations for this chapter.</p>
          ))}

        {tab === 'code' &&
          (snippets.length ? (
            snippets.map((snippet) => (
              <CodeBlock key={snippet.symbol} snippet={snippet} commit={source?.commit ?? null} />
            ))
          ) : (
            <p className="reference-empty">No source excerpt for this chapter.</p>
          ))}
      </div>

      <footer className="reference-foot">
        Source read directly from the installed package at extraction time — these are the lines that
        ran.
      </footer>
    </aside>
  )
}
