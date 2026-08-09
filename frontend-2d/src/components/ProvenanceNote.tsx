import type { SourceIndex, TraceMeta } from '@/data/types'

/** Where every number on this page came from, and what it is not. */
export function ProvenanceNote({ meta, source }: { meta: TraceMeta; source: SourceIndex }) {
  return (
    <footer className="provenance">
      <div className="section-label">Provenance</div>
      <p>{meta.note}</p>
      <p>
        Captured on {meta.device} with torch {meta.torch} from{' '}
        <code>
          {source.repository}@{source.commit}
        </code>{' '}
        — {meta.tokens} tokens, {meta.atoms.toLocaleString()} atoms, {meta.msaDepth} alignment rows from{' '}
        <code>{meta.msaSource}</code>, {meta.templates} template from <code>{meta.templateSource}</code>,{' '}
        {meta.recyclingSteps} recycling step and {meta.sampleSteps} diffusion steps. Regenerate with{' '}
        <code>python tools/capture_trace.py --output-dir public/data</code>.
      </p>
    </footer>
  )
}
