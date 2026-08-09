import { useEffect, useRef } from 'react'
import { useActiveChapter, useExplainer } from '../store'
import { BeatText } from './BeatText'
import { ShapeChip } from './ShapeChip'
import { TableOfContents } from './TableOfContents'

/** The left column: where you are, what is happening, and how to move. */
export const NarrativePanel = () => {
  const chapter = useActiveChapter()
  const beatIndex = useExplainer((s) => s.beatIndex)
  const chapterIndex = useExplainer((s) => s.chapterIndex)
  const goToBeat = useExplainer((s) => s.goToBeat)
  const activeRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [beatIndex, chapterIndex])

  if (!chapter) return null

  return (
    <section className="narrative">
      <TableOfContents />
      <header className="chapter-head">
        <span className="chapter-eyebrow">{chapter.section}</span>
        <h2>{chapter.title}</h2>
        <p className="chapter-blurb">{chapter.blurb}</p>
      </header>

      <ol className="beats">
        {chapter.beats.map((beat, index) => (
          <li
            key={beat.id}
            ref={index === beatIndex ? activeRef : undefined}
            className={beatClass(index, beatIndex)}
            onClick={() => goToBeat(chapterIndex, index)}
          >
            <BeatText text={beat.text} />
            {beat.shape && <ShapeChip shape={beat.shape} />}
          </li>
        ))}
      </ol>

      <Controls />
    </section>
  )
}

const beatClass = (index: number, active: number): string => {
  if (index === active) return 'beat beat-active'
  return index < active ? 'beat beat-past' : 'beat beat-future'
}

const Controls = () => {
  const { next, previous, autoplay, toggleAutoplay } = useExplainer()
  const chapter = useActiveChapter()
  const beatIndex = useExplainer((s) => s.beatIndex)

  return (
    <footer className="controls">
      <button className="control-step" onClick={previous} aria-label="Previous step">
        <span className="control-arrow" aria-hidden>
          ‹
        </span>
        <span>back</span>
      </button>

      <div className="control-centre">
        <button className="control-play" onClick={toggleAutoplay}>
          {autoplay ? '❙❙ pause' : '▶ play'}
        </button>
        <span className="control-count">
          {beatIndex + 1} / {chapter?.beats.length ?? 0}
        </span>
      </div>

      <button className="control-step control-next" onClick={next} aria-label="Next step">
        <span>next</span>
        <span className="control-arrow" aria-hidden>
          ›
        </span>
      </button>
    </footer>
  )
}
