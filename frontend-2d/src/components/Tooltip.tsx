import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  className?: string
}

/** A hover card rendered into a portal, so panel overflow cannot clip it. */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)

  const show = (event: { currentTarget: HTMLElement }) => {
    const box = event.currentTarget.getBoundingClientRect()
    setAnchor({ x: box.left + box.width / 2, y: box.top })
  }

  return (
    <span
      className={className}
      onMouseEnter={show}
      onMouseLeave={() => setAnchor(null)}
      onFocus={show}
      onBlur={() => setAnchor(null)}
      tabIndex={0}
    >
      {children}
      {anchor && createPortal(<Card x={anchor.x} y={anchor.y}>{content}</Card>, document.body)}
    </span>
  )
}

function Card({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const flipped = y < 150
  return (
    <div
      className="tooltip"
      role="tooltip"
      style={{
        left: clamp(x, 150, window.innerWidth - 150),
        top: flipped ? y + 26 : y - 10,
        transform: flipped ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      {children}
    </div>
  )
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
