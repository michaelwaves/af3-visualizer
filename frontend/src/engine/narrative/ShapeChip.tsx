import { Fragment } from 'react'
import { useExplainer } from '../store'
import type { TensorShape } from '../types'

const IS_LITERAL = /^\d+$/

/**
 * A tensor's axes, and nothing else — `pairwise [b, n, n, dp]`. What each symbol
 * means and how big it is lives in the legend, which highlights on hover, so the
 * annotation stays readable at a glance.
 */
export const ShapeChip = ({ shape }: { shape: TensorShape }) => {
  const setHoveredAxis = useExplainer((s) => s.setHoveredAxis)

  return (
    <div className="shape-chip">
      <span className="shape-name">{shape.name}</span>
      <span className="shape-dims">
        <span className="shape-bracket">[</span>
        {shape.dims.map((dim, index) => (
          <Fragment key={dim + index}>
            {index > 0 && <span className="shape-bracket">, </span>}
            <Axis symbol={dim} onHover={setHoveredAxis} />
          </Fragment>
        ))}
        <span className="shape-bracket">]</span>
      </span>
      {shape.note && <span className="shape-note">{shape.note}</span>}
    </div>
  )
}

const Axis = ({
  symbol,
  onHover,
}: {
  symbol: string
  onHover: (axis: string | null) => void
}) => {
  const definition = useExplainer((s) => s.pack?.axes[symbol] ?? null)
  const hovered = useExplainer((s) => s.hoveredAxis === symbol)

  if (IS_LITERAL.test(symbol)) return <span className="shape-literal">{symbol}</span>

  return (
    <span
      className={hovered ? 'shape-axis shape-axis-hot' : 'shape-axis'}
      title={definition ? `${definition.label} — ${definition.meaning}` : symbol}
      onMouseEnter={() => onHover(symbol)}
      onMouseLeave={() => onHover(null)}
    >
      {symbol}
    </span>
  )
}
