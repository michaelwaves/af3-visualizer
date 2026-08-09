import type { TraceMeta } from '@/data/types'

/** Title, subtitle and the provenance of the run everything else describes. */
export function Header({ meta }: { meta: TraceMeta }) {
  return (
    <header className="header">
      <div>
        <h1 className="header__title">AlphaFold3 Pytorch Implementation Visualized</h1>
        <p className="header__subtitle">
          A walkthrough of the architecture on inference from pdb <code>{meta.pdbId}</code> — {meta.title}
        </p>
      </div>
      <div className="header__chips">
        <Chip label="device" value={meta.device} />
        <Chip label="params" value={`${(meta.totalParameters / 1e6).toFixed(1)} M`} />
        <Chip label="tokens" value={`n = ${meta.tokens}`} />
        <Chip label="atoms" value={`m = ${meta.atoms}`} />
        <Chip label="forward" value={`${meta.forwardSeconds.toFixed(1)} s`} />
        <Chip label="peak mem" value={meta.peakMemoryGb ? `${meta.peakMemoryGb} GB` : '—'} />
      </div>
    </header>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="chip">
      <span className="chip__key">{label}</span>
      <span className="chip__value">{value}</span>
    </span>
  )
}
