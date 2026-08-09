import { useMemo, useState } from 'react'
import { formatNumber } from '@/lib/format'
import { buildScale, spread } from '@/lib/scale'
import { Legend } from './Legend'

/** Validated categorical trio — see `scripts/validate_palette.js`, all six checks pass. */
export const SERIES_COLOURS = ['#1d6392', '#c9622a', '#3f9ac9']

export interface Series {
  id: string
  label: string
  values: number[]
}

interface LineChartProps {
  series: Series[]
  xLabel: string
  yLabel: string
  logY?: boolean
  height?: number
  xTickEvery?: number
}

// `top` leaves room for the y-axis label to sit clear of the highest tick.
const PAD = { top: 28, right: 84, bottom: 30, left: 52 }
const WIDTH = 620

/** A small multi-series line chart with a crosshair readout. */
export function LineChart({
  series,
  xLabel,
  yLabel,
  logY = false,
  height = 210,
  xTickEvery,
}: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const count = series[0]?.values.length ?? 0
  const scale = useMemo(
    () => buildScale(series.map((entry) => entry.values), logY, height, PAD),
    [series, logY, height],
  )
  if (!count) return null

  const xAt = (index: number) =>
    PAD.left + (index / Math.max(1, count - 1)) * (WIDTH - PAD.left - PAD.right)
  const step = xTickEvery ?? Math.max(1, Math.round(count / 8))

  const track = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    const index = Math.round(ratio * (WIDTH - 1) - PAD.left) / (WIDTH - PAD.left - PAD.right)
    setHover(clamp(Math.round(index * (count - 1)), 0, count - 1))
  }

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="chart__svg"
        onMouseMove={track}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${yLabel} against ${xLabel}`}
      >
        {scale.ticks.map((tick) => (
          <g key={tick.value}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={tick.y} y2={tick.y} className="chart__grid" />
            <text x={PAD.left - 8} y={tick.y + 3} className="chart__tick chart__tick--y">
              {tick.label}
            </text>
          </g>
        ))}

        {Array.from({ length: count }, (_, index) => index)
          .filter((index) => index % step === 0 || index === count - 1)
          .map((index) => (
            <text key={index} x={xAt(index)} y={height - PAD.bottom + 16} className="chart__tick">
              {index}
            </text>
          ))}

        {series.map((entry, position) => (
          <path
            key={entry.id}
            d={entry.values.map((value, index) => `${index ? 'L' : 'M'}${xAt(index)},${scale.y(value)}`).join(' ')}
            className="chart__line"
            stroke={SERIES_COLOURS[position % SERIES_COLOURS.length]}
          />
        ))}

        {spread(series.map((entry) => scale.y(entry.values[count - 1]))).map((y, position) => (
          <g key={`${series[position].id}-label`}>
            <circle
              cx={WIDTH - PAD.right + 8}
              cy={y}
              r={3.5}
              fill={SERIES_COLOURS[position % SERIES_COLOURS.length]}
            />
            <text x={WIDTH - PAD.right + 16} y={y + 3.5} className="chart__direct">
              {series[position].label}
            </text>
          </g>
        ))}

        {hover !== null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={height - PAD.bottom} className="chart__crosshair" />
            {series.map((entry, position) => (
              <circle
                key={entry.id}
                cx={xAt(hover)}
                cy={scale.y(entry.values[hover])}
                r={4}
                fill={SERIES_COLOURS[position % SERIES_COLOURS.length]}
                className="chart__dot"
              />
            ))}
          </g>
        )}

        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={height - PAD.bottom} y2={height - PAD.bottom} className="chart__axis" />
        <text x={WIDTH - PAD.right} y={height - 4} className="chart__label chart__label--x">
          {xLabel}
        </text>
        <text x={PAD.left - 44} y={12} className="chart__label">
          {yLabel}
        </text>
      </svg>
      {series.length > 1 && <Legend series={series} />}
      <figcaption className="chart__readout">
        {hover === null
          ? `${count} points — hover to read values`
          : `${xLabel} ${hover} · ${series
              .map((entry) => `${entry.label} ${formatNumber(entry.values[hover], 3)}`)
              .join('  ·  ')}`}
      </figcaption>
    </figure>
  )
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
