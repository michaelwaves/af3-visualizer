import { useMemo } from 'react'
import katex from 'katex'
import type { Equation } from '../types'

/** One typeset equation, plus the symbols it introduces. */
export const MathBlock = ({ equation }: { equation: Equation }) => {
  const html = useMemo(() => render(equation.latex), [equation.latex])

  return (
    <section className="math-block">
      <h4>{equation.label}</h4>
      <div className="math-render" dangerouslySetInnerHTML={{ __html: html }} />
      {equation.note && <p className="math-note">{equation.note}</p>}
      {equation.where && (
        <dl className="math-where">
          {equation.where.map((entry) => (
            <div key={entry.symbol}>
              <dt dangerouslySetInnerHTML={{ __html: render(entry.symbol, false) }} />
              <dd>{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

/** KaTeX throws on malformed input; showing the source beats blanking the panel. */
const render = (latex: string, display = true): string => {
  try {
    return katex.renderToString(latex, { displayMode: display, throwOnError: false })
  } catch {
    return `<code>${latex}</code>`
  }
}
