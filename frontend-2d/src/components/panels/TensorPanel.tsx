import { useEffect, useState } from 'react'
import { loadTensor } from '@/data/load'
import { saveCsv, saveJson, saveNpy, type TensorFile } from '@/lib/download'
import { formatNumber } from '@/lib/format'
import type { Step } from '@/model/types'

const PREVIEW = 8

/** The raw numbers behind the picture, previewed and downloadable. */
export function TensorPanel({ step }: { step: Step }) {
  const [tensor, setTensor] = useState<TensorFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTensor(null)
    setError(null)
    if (!step.traceId) return
    let live = true
    loadTensor(step.traceId)
      .then((payload) => live && setTensor(payload as TensorFile))
      .catch((reason: Error) => live && setError(reason.message))
    return () => {
      live = false
    }
  }, [step.traceId])

  if (!step.traceId) return <p className="panel__empty">No tensor was recorded at this step.</p>
  if (error) return <p className="panel__empty">Could not load the tensor — {error}</p>
  if (!tensor) return <p className="panel__empty">Loading the recorded tensor…</p>

  const [rows, cols] = tensor.matrixShape
  return (
    <div className="tensor">
      <div className="tensor__bar">
        <span>
          <strong>{tensor.id}</strong> — {tensor.fullShape.join(' × ')} reduced to {rows} × {cols}
        </span>
        <span className="tensor__actions">
          <button onClick={() => saveNpy(`${tensor.id}.npy`, tensor.values)}>.npy</button>
          <button onClick={() => saveCsv(`${tensor.id}.csv`, tensor.values)}>.csv</button>
          <button onClick={() => saveJson(`${tensor.id}.json`, tensor)}>.json</button>
        </span>
      </div>
      <div className="tensor__grid" role="table">
        <div className="tensor__row tensor__row--head">
          <span className="tensor__cell tensor__cell--index" />
          {tensor.values[0]?.slice(0, PREVIEW).map((_, column) => (
            <span key={column} className="tensor__cell tensor__cell--index">
              {column}
            </span>
          ))}
          {cols > PREVIEW && <span className="tensor__cell tensor__cell--index">…</span>}
        </div>
        {tensor.values.slice(0, PREVIEW).map((row, index) => (
          <div key={index} className="tensor__row">
            <span className="tensor__cell tensor__cell--index">{index}</span>
            {row.slice(0, PREVIEW).map((value, column) => (
              <span key={column} className="tensor__cell">
                {formatNumber(value, 3)}
              </span>
            ))}
            {cols > PREVIEW && <span className="tensor__cell tensor__cell--index">…</span>}
          </div>
        ))}
        {rows > PREVIEW && (
          <div className="tensor__row">
            <span className="tensor__cell tensor__cell--index">⋮</span>
          </div>
        )}
      </div>
      <p className="tensor__note">
        The download is the same 2-D reduction shown in the Activations panel, at full float precision —
        the underlying {tensor.fullShape.join(' × ')} tensor is too large to ship in a page.
      </p>
    </div>
  )
}
