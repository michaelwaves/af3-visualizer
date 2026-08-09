import { Fragment } from 'react'
import { DimSymbol } from './DimSymbol'

interface ShapeChipProps {
  symbolic: string
  concrete?: number[]
  tone?: 'in' | 'out' | 'neutral'
}

/** Renders `b n n dp` with every axis hoverable, next to its measured size. */
export function ShapeChip({ symbolic, concrete, tone = 'neutral' }: ShapeChipProps) {
  const axes = tokenise(symbolic)
  return (
    <span className={`shape shape--${tone}`}>
      <span className="shape__symbolic">
        {axes.map((axis, position) => (
          <Fragment key={`${axis}-${position}`}>
            {position > 0 && <span className="shape__space"> </span>}
            <Axis token={axis} size={concrete?.[position]} />
          </Fragment>
        ))}
      </span>
      {concrete && <span className="shape__concrete">{concrete.join(' × ')}</span>}
    </span>
  )
}

function Axis({ token, size }: { token: string; size?: number }) {
  // Composite axes such as `(w*2)` still deserve a hover on the letter inside.
  if (!/^[a-z][a-z0-9_]*$/.test(token)) {
    const parts = token.split(/([a-z][a-z0-9_]*)/g).filter(Boolean)
    return (
      <>
        {parts.map((part, index) =>
          /^[a-z][a-z0-9_]*$/.test(part) ? (
            <DimSymbol key={index} symbol={part} />
          ) : (
            <span key={index} className="dim dim--plain">
              {part}
            </span>
          ),
        )}
      </>
    )
  }
  return <DimSymbol symbol={token} size={size} />
}

/** Splits `b nw w (w*2) dapi` into axes, keeping bracketed groups intact. */
function tokenise(symbolic: string): string[] {
  return symbolic.match(/\([^)]*\)|\S+/g) ?? []
}
