import { useState } from 'react'
import { useActiveChapter, useExplainer } from '../store'
import { DiagramDefs } from './architecture/DiagramDefs'
import { DiagramNodeShape } from './architecture/DiagramNodeShape'
import type { DiagramNode } from './architecture/types'

/**
 * The pack's architecture diagram, as the app's top bar. The box for the
 * chapter you are reading lights up; clicking any box jumps to its chapter.
 */
export const ArchitectureMap = () => {
  const pack = useExplainer((s) => s.pack)
  const chapter = useActiveChapter()
  const goToChapter = useExplainer((s) => s.goToChapter)
  const [open, setOpen] = useState(true)
  const [hovered, setHovered] = useState<DiagramNode | null>(null)

  const diagram = pack?.diagram
  if (!pack || !diagram) return null
  const [width, height] = diagram.viewBox

  const jump = (stage?: string) => {
    if (!stage) return
    const target = pack.chapters.findIndex((entry) => entry.stage === stage)
    if (target >= 0) goToChapter(target)
  }

  return (
    <div className={open ? 'diagram diagram-open' : 'diagram'}>
      <div className="diagram-bar">
        <button
          className="diagram-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          title={open ? 'Collapse the architecture diagram' : 'Show the architecture diagram'}
        >
          <span className="diagram-chevron">{open ? '▾' : '▸'}</span>
          Architecture
        </button>

        <p className="diagram-standfirst">
          {open && hovered ? describe(hovered) : diagram.caption}
        </p>

        <span className="diagram-credits">
          {pack.target && (
            <a href={pack.target.href} target="_blank" rel="noreferrer" title={pack.target.description}>
              {pack.target.label}
            </a>
          )}
          <a href={pack.source.href} target="_blank" rel="noreferrer">
            {pack.source.label} ↗
          </a>
        </span>
      </div>

      {open && (
        <svg className="diagram-svg" viewBox={`0 0 ${width} ${height}`} role="img">
          <DiagramDefs nodes={diagram.nodes} />
          {diagram.wires.map((wire, index) => (
            <path
              key={index}
              className={`diagram-wire diagram-wire-${wire.role}${wire.dashed ? ' is-dashed' : ''}`}
              d={wire.d}
              markerEnd={wire.head === false ? undefined : `url(#arrow-${wire.role})`}
            />
          ))}
          {diagram.nodes.map((node) => (
            <DiagramNodeShape
              key={node.id}
              node={node}
              active={!!node.stage && node.stage === chapter?.stage}
              clickable={!!node.stage}
              onSelect={() => jump(node.stage)}
              onHover={setHovered}
            />
          ))}
          {diagram.labels.map((label, index) => (
            <text
              key={index}
              className={`diagram-note diagram-note-${label.role ?? 'plain'}${
                label.faint ? ' is-faint' : ''
              }`}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor ?? 'start'}
            >
              {label.text}
            </text>
          ))}
        </svg>
      )}
    </div>
  )
}

const describe = (node: DiagramNode): string =>
  [node.label, node.sub].filter(Boolean).join(' ') + (node.note ? ` — ${node.note}` : '')
