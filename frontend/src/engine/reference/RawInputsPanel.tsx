import { useEffect, useState } from 'react'
import { useExplainer, usePackData } from '../store'
import type { RawInput } from '../types'

const PREVIEW_LINES = 1200

/** The files the featuriser actually read, shown verbatim and downloadable. */
export const RawInputsPanel = () => {
  const open = useExplainer((s) => s.rawInputsOpen)
  const toggle = useExplainer((s) => s.toggleRawInputs)
  const manifest = usePackData<{ inputs: RawInput[] }>('raw')
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const inputs = manifest?.inputs ?? []
  const active = inputs.find((entry) => entry.key === activeKey) ?? inputs[0]
  const text = useFileText(open ? active?.path : undefined)

  if (!open || !active) return null
  const lines = text?.split('\n') ?? []
  const clipped = lines.length > PREVIEW_LINES

  return (
    <aside className="reference raw-inputs">
      <header className="reference-head">
        <h2>inputs &amp; outputs</h2>
        <button onClick={toggle} aria-label="Close files">
          ✕
        </button>
      </header>

      <nav className="reference-tabs">
        {inputs.map((entry) => (
          <button
            key={entry.key}
            className={entry.key === active.key ? 'reference-tab reference-tab-on' : 'reference-tab'}
            onClick={() => setActiveKey(entry.key)}
          >
            <span className={roleClass(entry.role)} />
            {entry.label}
          </button>
        ))}
      </nav>

      <div className="raw-meta">
        <span className={`raw-role ${roleClass(active.role)}`}>{active.role}</span>
        <span>
          <code>{active.repositoryPath}</code>
        </span>
        <span>
          {active.format} · {(active.bytes / 1024).toFixed(0)} kB · {active.lines.toLocaleString()} lines
          {active.totalRecords ? ` · ${active.totalRecords.toLocaleString()} sequences` : ''}
        </span>
        <span className="raw-note">{active.note}</span>
      </div>

      <div className="reference-body raw-body">
        {text === null ? (
          <p className="reference-empty">loading…</p>
        ) : (
          <pre>
            <code>
              {lines.slice(0, PREVIEW_LINES).map((line, index) => (
                <span className="code-line" key={index}>
                  <span className="code-gutter">{index + 1}</span>
                  <span className="code-text">{line || ' '}</span>
                </span>
              ))}
            </code>
          </pre>
        )}
        {clipped && (
          <p className="reference-empty">
            Showing the first {PREVIEW_LINES.toLocaleString()} of {lines.length.toLocaleString()} lines
            — download for the rest.
          </p>
        )}
      </div>

      <footer className="inspector-actions">
        <a className="raw-download" href={active.path} download>
          download {active.label}
        </a>
      </footer>
    </aside>
  )
}

/** Colour-codes what the model does and does not see. */
const roleClass = (role: string): string =>
  role === 'model input' ? 'role-input' : role === 'model output' ? 'role-output' : 'role-reference'

/** Fetched on demand: these files are far larger than the rest of the payloads. */
const useFileText = (path: string | undefined): string | null => {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    if (!path) return
    let live = true
    setText(null)
    fetch(path)
      .then((response) => response.text())
      .then((body) => live && setText(body))
      .catch(() => live && setText('could not load this file'))
    return () => {
      live = false
    }
  }, [path])

  return text
}
