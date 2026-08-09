import { useState } from 'react'
import type { ActivationMap } from '@/data/types'
import { Heatmap } from '@/components/Heatmap'
import { loadTensor } from '@/data/load'
import { saveCsv, saveJson, saveNpy, type TensorFile } from '@/lib/download'
import { formatCount } from '@/lib/format'

/** What this module actually produced, painted, and downloadable at full precision. */
export function ActivationView({ traceId, map }: { traceId: string; map: ActivationMap }) {
  const [busy, setBusy] = useState<string | null>(null)
  const signed = map.min < 0 && map.max > 0

  const download = (format: 'npy' | 'csv' | 'json') => {
    setBusy(format)
    loadTensor(traceId)
      .then((payload) => {
        const tensor = payload as TensorFile
        if (format === 'npy') saveNpy(`${traceId}.npy`, tensor.values)
        else if (format === 'csv') saveCsv(`${traceId}.csv`, tensor.values)
        else saveJson(`${traceId}.json`, tensor)
      })
      .finally(() => setBusy(null))
  }

  return (
    <div className="activation">
      <Heatmap map={map} ramp={signed ? 'tide' : 'ocean'} />
      <dl className="facts">
        <dt>tensor</dt>
        <dd>{map.fullShape.join(' × ')}</dd>
        <dt>drawn as</dt>
        <dd>
          {map.rows} × {map.cols} — {map.reduction}
        </dd>
        <dt>elements</dt>
        <dd>{formatCount(map.fullShape.reduce((total, side) => total * side, 1))}</dd>
      </dl>
      <div className="downloads">
        <span className="section-label">Raw activation</span>
        <div className="downloads__buttons">
          {(['npy', 'csv', 'json'] as const).map((format) => (
            <button key={format} onClick={() => download(format)} disabled={busy !== null}>
              {busy === format ? '…' : `.${format}`}
            </button>
          ))}
        </div>
      </div>
      <p className="drawer__note">
        The download is the 2-D reduction shown above at full float precision. The underlying{' '}
        {map.fullShape.join(' × ')} tensor is too large to ship in a page.
      </p>
    </div>
  )
}
