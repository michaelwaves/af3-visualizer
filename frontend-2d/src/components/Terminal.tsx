import { useEffect, useRef, useState } from 'react'
import type { Payloads } from '@/data/types'
import { useWalkthrough } from '@/store/useWalkthrough'
import { completions, runCommand } from '@/terminal/commands'

/** An interactive prompt over the same data the panels show. */
export function Terminal({ payloads }: { payloads: Payloads }) {
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [recall, setRecall] = useState<number | null>(null)
  const log = useRef<HTMLDivElement>(null)

  const lines = useWalkthrough((state) => state.lines)
  const index = useWalkthrough((state) => state.index)
  const print = useWalkthrough((state) => state.print)
  const goTo = useWalkthrough((state) => state.goTo)
  const setTab = useWalkthrough((state) => state.setTab)
  const clearTerminal = useWalkthrough((state) => state.clearTerminal)

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [lines])

  const submit = () => {
    const line = draft.trim()
    if (!line) return
    print({ kind: 'input', text: line })
    setHistory((entries) => [...entries, line])
    setRecall(null)
    setDraft('')
    runCommand({ payloads, index, print, goTo, setTab, clear: clearTerminal }, line)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') return submit()
    if (event.key === 'Tab') {
      event.preventDefault()
      const matches = completions(draft.trim())
      if (matches.length === 1) setDraft(`${matches[0]} `)
      else if (matches.length > 1) print({ kind: 'note', text: matches.join('  ') })
      return
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (!history.length) return
      const position =
        recall === null
          ? history.length - 1
          : Math.min(history.length - 1, Math.max(0, recall + (event.key === 'ArrowUp' ? -1 : 1)))
      setRecall(position)
      setDraft(history[position])
    }
  }

  return (
    <section className="terminal" aria-label="Interactive terminal">
      <div className="terminal__log" ref={log}>
        {lines.map((line, position) => (
          <div key={position} className={`terminal__line terminal__line--${line.kind}`}>
            {line.kind === 'input' && <span className="terminal__caret">af3&gt;</span>}
            <span className="terminal__text">{line.text}</span>
          </div>
        ))}
      </div>
      <div className="terminal__prompt" onClick={(event) => event.currentTarget.querySelector('input')?.focus()}>
        <span className="terminal__caret">af3&gt;</span>
        <input
          className="terminal__input"
          value={draft}
          spellCheck={false}
          autoComplete="off"
          aria-label="terminal input"
          placeholder="help"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </section>
  )
}
