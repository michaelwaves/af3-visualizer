import { useEffect, useRef, useState } from 'react'
import { clamp01, robustExtent, type Ramp } from '../scene/texture'

interface Cell {
  row: number
  column: number
  value: number
}

/** Paints a matrix 1:1 and reports the value under the pointer. */
export const MatrixCanvas = ({ matrix, ramp }: { matrix: number[][]; ramp: Ramp }) => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [cell, setCell] = useState<Cell | null>(null)
  const rows = matrix.length
  const columns = matrix[0]?.length ?? 0

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context || !rows) return

    const flat = matrix.flat()
    const [low, high] = robustExtent(flat)
    const span = high - low || 1
    const image = context.createImageData(columns, rows)

    for (let index = 0; index < rows * columns; index++) {
      const [r, g, b] = ramp(clamp01((flat[index] - low) / span))
      image.data.set([r * 255, g * 255, b * 255, 255], index * 4)
    }
    context.putImageData(image, 0, 0)
  }, [matrix, ramp, rows, columns])

  const track = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const column = Math.floor(((event.clientX - bounds.left) / bounds.width) * columns)
    const row = Math.floor(((event.clientY - bounds.top) / bounds.height) * rows)
    if (row < 0 || column < 0 || row >= rows || column >= columns) return setCell(null)
    setCell({ row, column, value: matrix[row][column] })
  }

  return (
    <figure className="matrix-figure">
      <canvas
        ref={canvas}
        width={columns}
        height={rows}
        className="matrix-canvas"
        onMouseMove={track}
        onMouseLeave={() => setCell(null)}
      />
      <figcaption>
        {cell ? (
          <>
            <span>
              [{cell.row}, {cell.column}]
            </span>
            <strong>{cell.value.toFixed(3)}</strong>
          </>
        ) : (
          <span className="matrix-hint">hover to read a value</span>
        )}
      </figcaption>
    </figure>
  )
}
