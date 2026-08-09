import { scopeAt, STEPS } from '@/model/steps'
import { lookupDimension, GLOSSARY } from '@/model/glossary'
import { formatCount, formatNumber } from '@/lib/format'
import { fail, note, out, pad, type CommandContext } from './context'
import type { TerminalLine } from '@/store/useWalkthrough'

export function printScope({ index }: CommandContext): TerminalLine[] {
  const scope = scopeAt(index)
  return [
    note(`${scope.length} variables in scope at step ${index + 1} — ${STEPS[index].title}`),
    ...scope.map((variable) =>
      out(
        `  ${pad(variable.name, 26)} ${pad(variable.symbolic, 22)} ${
          variable.concrete ? variable.concrete.join(' × ') : ''
        }`,
      ),
    ),
  ]
}

export function printVariable(context: CommandContext, name: string): TerminalLine[] {
  const variable = scopeAt(context.index).find((entry) => entry.name === name)
  if (!variable) return [fail(`no variable named \`${name}\` in scope — try \`vars\``)]
  return [
    out(`${variable.name}`),
    out(`  shape     ${variable.symbolic}${variable.concrete ? ` = ${variable.concrete.join(' × ')}` : ''}`),
    out(`  dtype     ${variable.dtype ?? '—'}`),
    out(`  bound at  ${variable.definedAt}`),
    note(`  ${variable.description}`),
  ]
}

export function printStats(context: CommandContext, id?: string): TerminalLine[] {
  const traceId = id ?? STEPS[context.index].traceId
  if (!traceId) return [fail('this step recorded no tensor — pass a module id, e.g. `stats tri_mult_outgoing`')]
  const recorded = context.payloads.trace.steps.find((entry) => entry.id === traceId)
  if (!recorded) return [fail(`no recorded module \`${traceId}\` — try \`modules\``)]

  const lines = [note(`${recorded.module} — ${recorded.path} (${recorded.calls}× this pass)`)]
  for (const group of ['inputs', 'outputs'] as const) {
    lines.push(out(`  ${group}:`))
    for (const binding of recorded[group]) {
      const shape = binding.shape.length ? binding.shape.join(' × ') : binding.dtype
      const stats = binding.stats
        ? `min ${formatNumber(binding.stats.min)}  max ${formatNumber(binding.stats.max)}  μ ${formatNumber(
            binding.stats.mean,
          )}  σ ${formatNumber(binding.stats.std)}`
        : ''
      lines.push(out(`    ${pad(binding.name, 24)} ${pad(shape, 24)} ${stats}`))
    }
  }
  return lines
}

export function printModules(context: CommandContext): TerminalLine[] {
  const { steps } = context.payloads.trace
  return [
    note(`${steps.length} modules were hooked during the forward pass`),
    ...steps.map((step) =>
      out(`  ${pad(step.id, 30)} ${pad(step.module, 26)} ${pad(String(step.calls) + '×', 6)} ${formatCount(step.parameters)} params`),
    ),
  ]
}

export function printSteps(_context: CommandContext, stage?: string): TerminalLine[] {
  const listed = STEPS.map((step, index) => ({ step, index })).filter(
    (entry) => !stage || entry.step.stage === stage,
  )
  if (!listed.length) return [fail(`no stage \`${stage}\` — try input, embed, trunk, diffusion, confidence`)]
  return listed.map(({ step, index }) =>
    out(`  ${pad(String(index + 1), 4)} ${pad(step.stage, 11)} ${pad(step.id, 28)} ${step.title}`),
  )
}

export function printWhatis(_context: CommandContext, symbol: string): TerminalLine[] {
  const dimension = lookupDimension(symbol)
  if (!dimension) {
    return [
      fail(`\`${symbol}\` is not an axis symbol`),
      note(`known: ${Object.keys(GLOSSARY).join(' ')}`),
    ]
  }
  return [
    out(`${dimension.symbol} — ${dimension.name}${dimension.value !== undefined ? ` = ${dimension.value}` : ''}`),
    note(`  ${dimension.meaning}`),
    ...(dimension.origin ? [note(`  ${dimension.origin}`)] : []),
  ]
}

export function printMeta(context: CommandContext): TerminalLine[] {
  const { meta } = context.payloads.trace
  const entries: [string, string][] = [
    ['pdb', `${meta.pdbId} — ${meta.title}`],
    ['device', meta.device],
    ['torch', meta.torch],
    ['forward', `${meta.forwardSeconds} s, peak ${meta.peakMemoryGb ?? '—'} GB`],
    ['parameters', formatCount(meta.totalParameters)],
    ['tokens / atoms', `${meta.tokens} / ${meta.atoms}`],
    ['msa', `${meta.msaDepth} rows from ${meta.msaSource}`],
    ['template', `${meta.templates} × ${meta.templateSource}`],
    ['sampling', `${meta.sampleSteps} steps, ${meta.recyclingSteps} recycling`],
  ]
  return [...entries.map(([key, value]) => out(`  ${pad(key, 16)} ${value}`)), note(meta.note)]
}
