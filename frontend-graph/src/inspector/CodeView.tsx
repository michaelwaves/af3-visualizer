import { useMemo } from 'react'
import type { SourceIndex } from '@/data/types'
import { highlightPython } from '@/lib/highlight'

/** The real implementation, lifted from the package at the recorded commit. */
export function CodeView({ symbol, source }: { symbol: string; source: SourceIndex }) {
  const snippet = source.snippets[symbol]
  const lines = useMemo(() => snippet?.code.split('\n') ?? [], [snippet])

  if (!snippet) {
    return <p className="drawer__empty">No single source symbol for this node.</p>
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
