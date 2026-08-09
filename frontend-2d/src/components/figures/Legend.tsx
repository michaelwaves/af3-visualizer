import { SERIES_COLOURS, type Series } from './LineChart'

/** Identity is never colour alone: every series gets a swatch and a name. */
export function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="legend">
      {series.map((entry, position) => (
        <li key={entry.id}>
          <span
            className="legend__swatch"
            style={{ background: SERIES_COLOURS[position % SERIES_COLOURS.length] }}
          />
          {entry.label}
        </li>
      ))}
    </ul>
  )
}
