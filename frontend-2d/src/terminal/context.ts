import type { Payloads } from '@/data/types'
import type { PanelTab, TerminalLine } from '@/store/useWalkthrough'

export interface CommandContext {
  payloads: Payloads
  index: number
  print: (...lines: TerminalLine[]) => void
  goTo: (target: number | string) => boolean
  setTab: (tab: PanelTab) => void
  clear: () => void
}

export interface Command {
  name: string
  args?: string
  help: string
  run: (context: CommandContext, args: string[]) => void
}

export const out = (text: string): TerminalLine => ({ kind: 'output', text })
export const note = (text: string): TerminalLine => ({ kind: 'note', text })
export const fail = (text: string): TerminalLine => ({ kind: 'error', text })

/** Pads a label so command output lines up into columns. */
export const pad = (text: string, width: number): string => text.padEnd(width, ' ')
