import { useActiveBeat, useExplainer } from '../store'
import type { AxisDefinition } from '../types'

interface LegendRow {
  symbol: string
  size?: number
  definition: AxisDefinition | null
}

/**
 * Expands the axes of the active beat's shape. Keeping the definitions out of
 * the chip itself is what lets `[b, n, n, dp]` stay legible — the reader gets
 * the full story here, or by hovering a symbol.
 */
export const AxisLegend = () => {
  const beat = useActiveBeat()
  const axes = useExplainer((s) => s.pack?.axes ?? {})
  const hoveredAxis = useExplainer((s) => s.hoveredAxis)
  const setHoveredAxis = useExplainer((s) => s.setHoveredAxis)

  const rows = beat?.shape ? buildRows(beat.shape.dims, beat.shape.sizes, axes) : []
  if (!rows.length) return null

  return (
    <aside className="axis-legend">
      <h3>axes</h3>
      <dl>
        {rows.map((row) => (
          <div
            key={row.symbol}
            className={hoveredAxis === row.symbol ? 'axis-row axis-row-hot' : 'axis-row'}
            onMouseEnter={() => setHoveredAxis(row.symbol)}
            onMouseLeave={() => setHoveredAxis(null)}
          >
            <dt>{row.symbol}</dt>
            <dd>
              <span className="axis-label">{row.definition?.label ?? '—'}</span>
              {row.size !== undefined && <span className="axis-size">{row.size.toLocaleString()}</span>}
              <span className="axis-meaning">{row.definition?.meaning ?? 'not defined by this pack'}</span>
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  )
}

/** One row per distinct symbol, preferring the shape's own size over the default. */
const buildRows = (
  dims: string[],
  sizes: number[] | undefined,
  axes: Record<string, AxisDefinition>,
): LegendRow[] => {
  const rows = new Map<string, LegendRow>()

  dims.forEach((symbol, index) => {
    if (/^\d+$/.test(symbol) || rows.has(symbol)) return
    const definition = axes[symbol] ?? null
    rows.set(symbol, {
      symbol,
      size: sizes?.[index] ?? definition?.size,
      definition,
    })
  })

  return [...rows.values()]
}
