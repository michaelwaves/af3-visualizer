import { Fragment, type ReactNode } from 'react'

/** Renders the authored paragraphs, honouring `backticks` as inline code. */
export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="prose">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{inlineCode(paragraph)}</p>
      ))}
    </div>
  )
}

export function inlineCode(text: string): ReactNode[] {
  return text.split(/`([^`]+)`/g).map((chunk, index) =>
    index % 2 === 1 ? (
      <code key={index}>{chunk}</code>
    ) : (
      <Fragment key={index}>{chunk}</Fragment>
    ),
  )
}
