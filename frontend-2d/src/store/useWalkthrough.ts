import { create } from 'zustand'
import type { Payloads } from '@/data/types'
import { STEPS, stepIndex } from '@/model/steps'
import { STEPS_WITH_DATA } from '@/model/figures'

export type PanelTab = 'math' | 'code' | 'activation' | 'tensor' | 'data'

export interface TerminalLine {
  kind: 'input' | 'output' | 'error' | 'note'
  text: string
}

interface WalkthroughState {
  payloads: Payloads | null
  index: number
  tab: PanelTab
  lines: TerminalLine[]
  setPayloads: (payloads: Payloads) => void
  goTo: (target: number | string) => boolean
  advance: (delta: number) => void
  setTab: (tab: PanelTab) => void
  print: (...lines: TerminalLine[]) => void
  clearTerminal: () => void
}

const BANNER: TerminalLine[] = [
  { kind: 'note', text: 'af3db — AlphaFold 3 forward-pass debugger. Type `help` for commands.' },
]

export const useWalkthrough = create<WalkthroughState>((set, get) => ({
  payloads: null,
  index: 0,
  tab: 'math',
  lines: BANNER,

  setPayloads: (payloads) => set({ payloads }),

  goTo: (target) => {
    const index = typeof target === 'number' ? target : stepIndex(target)
    if (index < 0 || index >= STEPS.length) return false
    set({ index, tab: preferredTab(index) })
    return true
  },

  advance: (delta) => {
    const index = clamp(get().index + delta, 0, STEPS.length - 1)
    set({ index, tab: preferredTab(index) })
  },

  setTab: (tab) => set({ tab }),

  print: (...lines) => set((state) => ({ lines: [...state.lines, ...lines].slice(-400) })),

  clearTerminal: () => set({ lines: BANNER }),
}))

/** Land on the panel with something to show, rather than an empty Math tab. */
function preferredTab(index: number): PanelTab {
  const step = STEPS[index]
  if (STEPS_WITH_DATA.has(step.id)) return 'data'
  if (step.traceId) return 'activation'
  if (step.math?.length) return 'math'
  return step.sourceSymbol ? 'code' : 'math'
}

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value))
