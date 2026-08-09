import { STEPS, stepIndex } from '@/model/steps'
import { fail, note, out, type Command, type CommandContext } from './context'
import { printSteps } from './inspect'

/** Commands that move the execution pointer. */
export const NAVIGATION: Command[] = [
  {
    name: 'where',
    help: 'show the current position in the forward pass',
    run: (context) => {
      const step = STEPS[context.index]
      context.print(
        out(`step ${context.index + 1}/${STEPS.length}  ${step.stage} › ${step.id}`),
        out(`  ${step.title} — ${step.module}${step.algorithm ? ` (${step.algorithm})` : ''}`),
        note(`  ${step.summary}`),
      )
    },
  },
  {
    name: 'next',
    args: '[n]',
    help: 'advance n steps (default 1)',
    run: (context, args) => move(context, Number(args[0] ?? 1)),
  },
  {
    name: 'prev',
    args: '[n]',
    help: 'go back n steps (default 1)',
    run: (context, args) => move(context, -Number(args[0] ?? 1)),
  },
  {
    name: 'goto',
    args: '<id|number>',
    help: 'jump to a step by id or position',
    run: (context, args) => {
      const target = args[0]
      if (!target) return context.print(fail('goto needs a step id or number'))
      const index = /^\d+$/.test(target) ? Number(target) - 1 : stepIndex(target)
      if (!context.goTo(index)) return context.print(fail(`no step \`${target}\` — try \`steps\``))
      context.print(out(`→ ${STEPS[index].title}`))
    },
  },
  {
    name: 'steps',
    args: '[stage]',
    help: 'list steps, optionally filtered by stage',
    run: (context, args) => context.print(...printSteps(context, args[0])),
  },
]

function move(context: CommandContext, delta: number): void {
  if (!Number.isFinite(delta)) return context.print(fail('expected a number of steps'))
  const target = Math.min(STEPS.length - 1, Math.max(0, context.index + delta))
  context.goTo(target)
  context.print(out(`→ ${target + 1}/${STEPS.length}  ${STEPS[target].title}`))
}
