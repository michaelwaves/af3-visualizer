import { create } from 'zustand'
import type { Payloads } from '@/data/types'
import { hasLevel, node, ROOT } from '@/graph'

/** `auto` names only the selected node's wires; `all` names every wire. */
export type LabelMode = 'auto' | 'all' | 'none'

interface GraphState {
  payloads: Payloads | null
  /** The level currently drawn on the canvas. */
  levelId: string
  /** The node whose details are open in the drawer, if any. */
  selectedId: string | null
  labels: LabelMode
  setPayloads: (payloads: Payloads) => void
  open: (id: string) => void
  select: (id: string | null) => void
  goUp: () => void
  setLabels: (labels: LabelMode) => void
}

export const useGraph = create<GraphState>((set, get) => ({
  payloads: null,
  levelId: ROOT,
  selectedId: null,
  labels: 'auto',

  setPayloads: (payloads) => set({ payloads }),

  /** Descend into a group, or reveal the level a node lives on. */
  open: (id) => {
    if (hasLevel(id)) return set({ levelId: id, selectedId: id })
    const entry = node(id)
    if (entry) set({ levelId: entry.group ?? ROOT, selectedId: id })
  },

  select: (id) => set({ selectedId: id }),

  goUp: () => {
    const current = node(get().levelId)
    set({ levelId: current?.group ?? ROOT, selectedId: current?.id ?? null })
  },

  setLabels: (labels) => set({ labels }),
}))
