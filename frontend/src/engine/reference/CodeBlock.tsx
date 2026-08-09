import { useMemo, useState } from 'react'
import { tokenize } from './highlight'
import type { SourceSnippet } from '../types'

const COLLAPSED_LINES = 26

/** A verbatim excerpt of the model's source, with its real file and line range. */
export const CodeBlock = ({ snippet, commit }: { snippet: SourceSnippet; commit: string | null }) => {
  const [expanded, setExpanded] = useState(false)
  const lines = useMemo(() => snippet.code.split('\n'), [snippet.code])
  const truncated = !expanded && lines.length > COLLAPSED_LINES
  const shown = truncated ? lines.slice(0, COLLAPSED_LINES) : lines

  return (
    <section className="code-block">
      <header>
        <code className="code-symbol">{snippet.symbol}</code>
        <span className="code-origin">
          {snippet.file}:{snippet.startLine}–{snippet.endLine}
          {commit && <span className="code-commit"> @ {commit}</span>}
        </span>
      </header>

      <pre>
        <code>
          {shown.map((line, index) => (
            <span className="code-line" key={index}>
              <span className="code-gutter">{snippet.startLine + index}</span>
              <span className="code-text">
                {tokenize(line).map((token, position) => (
                  <span key={position} className={token.kind ? `tok-${token.kind}` : undefined}>
                    {token.text}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>

      {lines.length > COLLAPSED_LINES && (
        <button className="code-more" onClick={() => setExpanded(!expanded)}>
          {truncated ? `show all ${lines.length} lines` : 'collapse'}
        </button>
      )}
    </section>
  )
}
