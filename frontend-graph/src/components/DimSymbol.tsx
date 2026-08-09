import { lookupDimension } from '@/model/glossary'
import { Tooltip } from './Tooltip'

interface DimSymbolProps {
  symbol: string
  /** The measured size at this point in the pass, when it is known. */
  size?: number
}

/** One axis of a shape. Hover it to learn what the letter means and how big it is. */
export function DimSymbol({ symbol, size }: DimSymbolProps) {
  const dimension = lookupDimension(symbol)
  if (!dimension) return <span className="dim dim--plain">{symbol}</span>

  const value = size ?? dimension.value

  return (
    <Tooltip
      className="dim"
      content={
        <>
          <div className="tooltip__head">
            <span className="tooltip__symbol">{dimension.symbol}</span>
            <span className="tooltip__name">{dimension.name}</span>
            {value !== undefined && <span className="tooltip__value">= {value.toLocaleString()}</span>}
          </div>
          <p className="tooltip__body">{dimension.meaning}</p>
          {dimension.origin && <p className="tooltip__origin">{dimension.origin}</p>}
        </>
      }
    >
      {symbol}
    </Tooltip>
  )
}
