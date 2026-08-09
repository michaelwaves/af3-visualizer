import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActivationMap } from '@/data/types'
import { buildLookup, cssRamp, type RampName } from '@/lib/colormap'
import { decodeMap, sampleValue } from '@/lib/decodeMap'
import { formatNumber } from '@/lib/format'

interface HeatmapProps {
  map: ActivationMap
  ramp?: RampName
}

/** Paints one recorded activation, with a readout of the value under the cursor. */
export function Heatmap({ map, ramp = 'ocean' }: HeatmapProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [probe, setProbe] = useState<{ row: number; col: number; value: number } | null>(null)
  const decoded = useMemo(() => decodeMap(map), [map])

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) return
    const lookup = buildLookup(ramp)
    const image = context.createImageData(decoded.cols, decoded.rows)
    for (let index = 0; index < decoded.samples.length; index += 1) {
      image.data.set(lookup.subarray(decoded.samples[index] * 4, decoded.samples[index] * 4 + 4), index * 4)
    }
    context.putImageData(image, 0, 0)
  }, [decoded, ramp])

  const track = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const col = Math.floor(((event.clientX - box.left) / box.width) * decoded.cols)
    const row = Math.floor(((event.clientY - box.top) / box.height) * decoded.rows)
    if (row < 0 || col < 0 || row >= decoded.rows || col >= decoded.cols) return setProbe(null)
    setProbe({ row, col, value: sampleValue(decoded, row, col) })
  }

  return (
    <figure className="heatmap">
      <div className="heatmap__frame">
        <span className="heatmap__axis heatmap__axis--y">{map.axes[1]}</span>
        <canvas
          ref={canvas}
          width={decoded.cols}
          height={decoded.rows}
          className="heatmap__canvas"
          style={{ aspectRatio: `${decoded.cols} / ${decoded.rows}` }}
          onMouseMove={track}
          onMouseLeave={() => setProbe(null)}
        />
        <span className="heatmap__axis heatmap__axis--x">{map.axes[0]}</span>
      </div>
      <figcaption className="heatmap__legend">
        <span className="heatmap__scale" style={{ background: `linear-gradient(90deg, ${cssRamp(ramp)})` }} />
        <span className="heatmap__bound">{formatNumber(map.min)}</span>
        <span className="heatmap__bound heatmap__bound--right">{formatNumber(map.max)}</span>
        <span className="heatmap__probe">
          {probe
            ? `[${probe.row}, ${probe.col}] = ${formatNumber(probe.value, 4)}`
            : `${decoded.rows} × ${decoded.cols} drawn`}
        </span>
      </figcaption>
    </figure>
  )
}
