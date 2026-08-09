import { useEffect, useRef } from 'react'
import type { MsaPayload } from '@/data/types'
import { LineChart } from './LineChart'

const GAP = 31
/** Match query · substitution · gap — three states, not thirty-two hues. */
const STATES: [string, [number, number, number]][] = [
  ['identical to query', [16, 52, 88]],
  ['substitution', [126, 178, 209]],
  ['gap', [235, 241, 246]],
]

/** The real ColabFold alignment: which rows agree with the query, and where. */
export function MsaFigure({ msa }: { msa: MsaPayload }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const rows = msa.tokens.length
  const cols = msa.tokens[0]?.length ?? 0

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context || !cols) return
    const image = context.createImageData(cols, rows)
    const query = msa.tokens[0]
    msa.tokens.forEach((row, y) => {
      row.forEach((symbol, x) => {
        const state = symbol === GAP ? 2 : symbol === query[x] ? 0 : 1
        image.data.set([...STATES[state][1], 255], (y * cols + x) * 4)
      })
    })
    context.putImageData(image, 0, 0)
  }, [msa, rows, cols])

  return (
    <div className="figure">
      <div className="figure__head">
        <span className="figure__title">{msa.source}</span>
        <span className="figure__sub">
          {msa.depth.toLocaleString()} sequences × {msa.length} columns — top {rows} drawn
        </span>
      </div>
      <canvas
        ref={canvas}
        width={cols}
        height={rows}
        className="figure__raster"
        style={{ aspectRatio: `${cols} / ${rows}` }}
      />
      <ul className="legend">
        {STATES.map(([label, colour]) => (
          <li key={label}>
            <span className="legend__swatch" style={{ background: `rgb(${colour.join(',')})` }} />
            {label}
          </li>
        ))}
      </ul>
      <LineChart
        series={[{ id: 'conservation', label: 'conservation', values: msa.conservation }]}
        xLabel="column"
        yLabel="0 – 1"
        height={180}
      />
      <p className="figure__note">
        Conservation here is 1 − normalised Shannon entropy over the 20 amino acids, computed on all{' '}
        {msa.depth.toLocaleString()} rows rather than the {rows} drawn above. 1 means the column never
        varies. This is the same alignment the 32-wide profile in <code>additional_token_feats</code> is
        reduced from.
      </p>
    </div>
  )
}
