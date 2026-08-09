import { useMemo } from 'react'
import type { SourceIndex } from '@/data/types'
import { highlightPython } from '@/lib/highlight'
import type { Step } from '@/model/types'

interface CodePanelProps {
  step: Step
  source: SourceIndex
}

/** The real implementation, lifted out of the package at the recorded commit. */
export function CodePanel({ step, source }: CodePanelProps) {
  const snippet = step.sourceSymbol ? source.snippets[step.sourceSymbol] : undefined
  const lines = useMemo(() => snippet?.code.split('\n') ?? [], [snippet])

  if (!snippet) {
    return <p className="panel__empty">This step spans several call sites rather than one function.</p>
  }

  return (
    <div className="code">
      <div className="code__bar">
        <span className="code__symbol">{snippet.symbol}</span>
        <span className="code__origin">
          {snippet.file}:{snippet.startLine}–{snippet.endLine}
          <span className="code__commit">@{source.commit}</span>
        </span>
      </div>
      <pre className="code__body">
        <code>
          {lines.map((line, offset) => (
            <span key={offset} className="code__line">
              <span className="code__number">{snippet.startLine + offset}</span>
              <span className="code__text">{highlightPython(line)}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}
