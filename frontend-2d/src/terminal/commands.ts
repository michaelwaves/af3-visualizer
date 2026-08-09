import { fail, note, out, pad, type Command, type CommandContext } from './context'
import { NAVIGATION } from './navigation'
import { PANELS } from './panels'
import { printMeta, printModules, printScope, printStats, printVariable, printWhatis } from './inspect'

const INSPECTION: Command[] = [
  { name: 'vars', help: 'list the variables currently in scope', run: (c) => c.print(...printScope(c)) },
  {
    name: 'print',
    args: '<var>',
    help: 'describe one variable in scope',
    run: (context, args) =>
      context.print(...(args[0] ? printVariable(context, args[0]) : [fail('print needs a variable name')])),
  },
  {
    name: 'stats',
    args: '[module]',
    help: 'recorded tensor statistics for a hooked module',
    run: (context, args) => context.print(...printStats(context, args[0])),
  },
  { name: 'modules', help: 'list every module that was hooked', run: (c) => c.print(...printModules(c)) },
  {
    name: 'whatis',
    args: '<axis>',
    help: 'explain an axis symbol such as n, dp or nw',
    run: (context, args) =>
      context.print(...(args[0] ? printWhatis(context, args[0]) : [fail('whatis needs a symbol')])),
  },
  { name: 'meta', help: 'provenance of the captured run', run: (c) => c.print(...printMeta(c)) },
]

export const COMMANDS: Command[] = [
  { name: 'help', help: 'list every command', run: (context) => context.print(...helpLines()) },
  ...NAVIGATION,
  ...INSPECTION,
  ...PANELS,
  { name: 'clear', help: 'clear the terminal', run: (context) => context.clear() },
]

const BY_NAME = new Map(COMMANDS.map((command) => [command.name, command]))

const ALIASES: Record<string, string> = {
  n: 'next',
  p: 'print',
  s: 'steps',
  bt: 'where',
  ls: 'steps',
  step: 'next',
  back: 'prev',
  '?': 'help',
}

export function runCommand(context: CommandContext, line: string): void {
  const [word, ...args] = line.trim().split(/\s+/)
  if (!word) return
  const command = BY_NAME.get(ALIASES[word] ?? word)
  if (!command) return context.print(fail(`unknown command \`${word}\` — type \`help\``))
  command.run(context, args)
}

export const completions = (prefix: string): string[] =>
  [...BY_NAME.keys()].filter((name) => name.startsWith(prefix))

const helpLines = () => [
  note('commands — arrow keys recall history, tab completes'),
  ...COMMANDS.map((command) => out(`  ${pad(`${command.name} ${command.args ?? ''}`.trim(), 20)} ${command.help}`)),
]
