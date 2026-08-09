import { STEPS } from '@/model/steps'
import { STEPS_WITH_DATA } from '@/model/figures'
import { loadTensor } from '@/data/load'
import { saveJson, type TensorFile } from '@/lib/download'
import { fail, note, out, type Command } from './context'

/** Commands that open a panel, or pull a tensor out of one. */
export const PANELS: Command[] = [
  {
    name: 'code',
    help: 'open the Code panel for this step',
    run: (context) => {
      const step = STEPS[context.index]
      if (!step.sourceSymbol) return context.print(fail('this step has no single source symbol'))
      context.setTab('code')
      const snippet = context.payloads.source.snippets[step.sourceSymbol]
      context.print(out(`${snippet.symbol} — ${snippet.file}:${snippet.startLine}–${snippet.endLine}`))
    },
  },
  {
    name: 'map',
    help: 'open the Activations panel for this step',
    run: (context) => {
      const step = STEPS[context.index]
      if (!step.traceId) return context.print(fail('nothing was recorded at this step'))
      context.setTab('activation')
      const map = context.payloads.maps[step.traceId]
      context.print(out(`${step.traceId} — ${map.rows} × ${map.cols}, ${map.reduction}`))
    },
  },
  {
    name: 'data',
    help: 'open the Measured data panel, when this step has one',
    run: (context) => {
      const step = STEPS[context.index]
      if (!STEPS_WITH_DATA.has(step.id)) {
        return context.print(fail('no measured-data figure here'), note(`try: ${[...STEPS_WITH_DATA].join(' ')}`))
      }
      context.setTab('data')
      context.print(out(`showing measured data for ${step.id}`))
    },
  },
  {
    name: 'download',
    help: "save this step's recorded tensor as JSON",
    run: (context) => {
      const step = STEPS[context.index]
      if (!step.traceId) return context.print(fail('nothing was recorded at this step'))
      context.print(note(`fetching ${step.traceId}…`))
      loadTensor(step.traceId)
        .then((payload) => {
          saveJson(`${step.traceId}.json`, payload)
          const tensor = payload as TensorFile
          context.print(out(`saved ${step.traceId}.json — ${tensor.matrixShape.join(' × ')}`))
        })
        .catch((reason: Error) => context.print(fail(reason.message)))
    },
  },
]
