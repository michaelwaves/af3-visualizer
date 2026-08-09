import { useState } from 'react'
import { useActiveChapter, useExplainer } from '../store'
import type { PipelineStage } from '../types'

/**
 * Where the current chapter sits in the forward pass. Collapsed it is a rail of
 * stages; expanded it names the class each stage actually invokes.
 */
export const PipelineMap = () => {
  const pack = useExplainer((s) => s.pack)
  const chapter = useActiveChapter()
  const goToChapter = useExplainer((s) => s.goToChapter)
  const [expanded, setExpanded] = useState(false)
  if (!pack?.pipeline.length) return null

  const activeIndex = pack.pipeline.findIndex((stage) => stage.id === chapter?.stage)

  const jumpToStage = (stage: PipelineStage) => {
    const target = pack.chapters.findIndex((entry) => entry.stage === stage.id)
    if (target >= 0) goToChapter(target)
  }

  return (
    <div className={expanded ? 'pipeline pipeline-open' : 'pipeline'}>
      <button className="pipeline-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'hide pipeline' : 'forward pass'}
      </button>

      <ol className="pipeline-rail">
        {pack.pipeline.map((stage, index) => (
          <li
            key={stage.id}
            className={stageClass(index, activeIndex, stage)}
            onClick={() => jumpToStage(stage)}
            title={`${stage.module}${stage.algorithm ? ` · ${stage.algorithm}` : ''}`}
          >
            <span className="pipeline-dot" />
            <span className="pipeline-label">{stage.label}</span>
            {expanded && (
              <span className="pipeline-detail">
                <code>{stage.module}</code>
                {stage.algorithm && <em>{stage.algorithm}</em>}
                {stage.note && <span>{stage.note}</span>}
              </span>
            )}
          </li>
        ))}
      </ol>

      {expanded && (
        <p className="pipeline-footnote">
          Stages between <strong>templates</strong> and <strong>Pairformer</strong> repeat once per
          recycling step. Click a stage to jump to its chapter.
        </p>
      )}
    </div>
  )
}

const stageClass = (index: number, activeIndex: number, stage: PipelineStage): string => {
  const classes = ['pipeline-stage']
  if (stage.loop) classes.push('pipeline-stage-loop')
  if (activeIndex < 0) return classes.join(' ')
  if (index === activeIndex) classes.push('pipeline-stage-active')
  else if (index < activeIndex) classes.push('pipeline-stage-done')
  return classes.join(' ')
}
