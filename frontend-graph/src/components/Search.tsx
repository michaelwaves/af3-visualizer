import { useMemo, useState } from 'react'
import { ALL_NODES, trail } from '@/graph'
import { useGraph } from '@/store/useGraph'

/** Three different nodes are called "Pairwise block" — say which one this is. */
const where = (id: string): string => {
  const path = trail(id).slice(0, -1)
  return path.length ? path.map((crumb) => crumb.label).join(' › ') : 'top level'
}

const LIMIT = 8

/** Jump straight to any module in the tree, wherever it lives. */
export function Search() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const open = useGraph((state) => state.open)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return ALL_NODES.filter(
      (node) =>
        node.kind !== 'port' &&
        (node.label.toLowerCase().includes(needle) ||
          node.module.toLowerCase().includes(needle) ||
          node.algorithm?.toLowerCase().includes(needle)),
    ).slice(0, LIMIT)
  }, [query])

  const jump = (id: string) => {
    open(id)
    setQuery('')
    setFocused(false)
  }

  return (
    <div className="search">
      <input
        className="search__input"
        value={query}
        placeholder="Find a module — TriangleAttention, Algorithm 12, denoiser…"
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onKeyDown={(event) => event.key === 'Enter' && matches[0] && jump(matches[0].id)}
        aria-label="Find a module"
      />
      {focused && matches.length > 0 && (
        <ul className="search__results">
          {matches.map((node) => (
            <li key={node.id}>
              <button onClick={() => jump(node.id)}>
                <span className="search__label">{node.label}</span>
                <span className="search__module">{node.module}</span>
                <span className="search__where">
                  {where(node.id)}
                  {node.algorithm && <span className="search__algo"> · {node.algorithm}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
