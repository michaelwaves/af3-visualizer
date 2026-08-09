import { useState } from 'react'
import type { SourceIndex, TraceMeta } from '@/data/types'

/** Where every number in the graph came from, and what it is not. */
export function ProvenanceBar({ meta, source }: { meta: TraceMeta; source: SourceIndex }) {
  const [open, setOpen] = useState(false)

  return (
    <footer className={`provenance ${open ? 'is-open' : ''}`}>
      <button className="provenance__toggle" onClick={() => setOpen(!open)}>
        <span className="provenance__flag">untrained weights</span>
        <span className="provenance__lede">
          Shapes, modules and code paths are real; the values are a forward pass of an untrained
          network.
        </span>
        <span className="provenance__chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="provenance__body">
          <p>{meta.note}</p>
          <p>
            Captured on {meta.device} with torch {meta.torch} from{' '}
            <code>
              {source.repository}@{source.commit}
            </code>{' '}
            — {meta.tokens} tokens, {meta.atoms.toLocaleString()} atoms, {meta.msaDepth} alignment rows
            from <code>{meta.msaSource}</code>, {meta.templates} template from{' '}
            <code>{meta.templateSource}</code>, {meta.recyclingSteps} recycling step and{' '}
            {meta.sampleSteps} diffusion steps. Regenerate with{' '}
            <code>python tools/capture_trace.py --output-dir public/data</code> in{' '}
            <code>frontend-2d</code>.
          </p>
        </div>
      )}
    </footer>
  )
}
