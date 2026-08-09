import { Fragment, type ReactNode } from 'react'

const TOKEN = /(`[^`]+`|\*[^*]+\*)/g

/**
 * Inline formatting for beat prose: `code` and *emphasis*. Deliberately tiny —
 * beats are single paragraphs, not documents.
 */
export const BeatText = ({ text }: { text: string }) => (
  <p className="beat-text">{format(text)}</p>
)

export const format = (text: string): ReactNode[] =>
  text.split(TOKEN).map((piece, index) => {
    if (piece.startsWith('`') && piece.endsWith('`')) {
      return <code key={index}>{piece.slice(1, -1)}</code>
    }
    if (piece.startsWith('*') && piece.endsWith('*')) {
      return <em key={index}>{piece.slice(1, -1)}</em>
    }
    return <Fragment key={index}>{piece}</Fragment>
  })
