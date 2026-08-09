import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Step } from '@/model/types'

/** The equations for the current step, rendered with KaTeX. */
export function MathPanel({ step }: { step: Step }) {
  if (!step.math?.length) {
    return (
      <p className="panel__empty">
        No equation for this step — it is bookkeeping rather than arithmetic. The Code panel shows what
        actually runs.
      </p>
    )
  }
  return (
    <div className="math">
      {step.math.map((line, index) => (
        <figure key={index} className="math__line">
          <Tex tex={line.tex} />
          {line.caption && <figcaption className="math__caption">{line.caption}</figcaption>}
        </figure>
      ))}
    </div>
  )
}

function Tex({ tex }: { tex: string }) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!host.current) return
    try {
      katex.render(tex, host.current, { displayMode: true, throwOnError: false, output: 'html' })
    } catch {
      host.current.textContent = tex
    }
  }, [tex])

  return <div ref={host} className="math__tex" />
}
