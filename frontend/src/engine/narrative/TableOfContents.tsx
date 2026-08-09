import { useState } from 'react'
import { useExplainer } from '../store'
import type { Chapter } from '../types'

/** Collapsible chapter index, grouped by the section each chapter declares. */
export const TableOfContents = () => {
  const pack = useExplainer((s) => s.pack)
  const chapterIndex = useExplainer((s) => s.chapterIndex)
  const goToChapter = useExplainer((s) => s.goToChapter)
  const [open, setOpen] = useState(false)
  if (!pack) return null

  const current = pack.chapters[chapterIndex]

  return (
    <nav className={open ? 'toc toc-open' : 'toc'}>
      <button className="toc-toggle" onClick={() => setOpen(!open)}>
        <span className="toc-counter">
          {String(chapterIndex + 1).padStart(2, '0')} / {String(pack.chapters.length).padStart(2, '0')}
        </span>
        <span className="toc-current">{current.title}</span>
        <span className="toc-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <ol className="toc-list">
          {groupBySection(pack.chapters).map(([section, chapters]) => (
            <li key={section}>
              <span className="toc-section">{section}</span>
              <ul>
                {chapters.map(({ chapter, index }) => (
                  <li
                    key={chapter.id}
                    className={index === chapterIndex ? 'toc-item toc-item-active' : 'toc-item'}
                    onClick={() => {
                      goToChapter(index)
                      setOpen(false)
                    }}
                  >
                    <span className="toc-index">{String(index + 1).padStart(2, '0')}</span>
                    <span>
                      <strong>{chapter.title}</strong>
                      <em>{chapter.blurb}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </nav>
  )
}

type Indexed = { chapter: Chapter; index: number }

const groupBySection = (chapters: Chapter[]): [string, Indexed[]][] => {
  const groups = new Map<string, Indexed[]>()
  chapters.forEach((chapter, index) => {
    const bucket = groups.get(chapter.section) ?? []
    bucket.push({ chapter, index })
    groups.set(chapter.section, bucket)
  })
  return [...groups.entries()]
}
