import { create } from 'zustand'
import type { Beat, Chapter, ModelPack } from './types'

interface ExplainerState {
  pack: ModelPack | null
  chapterIndex: number
  beatIndex: number
  /** 0..1 ease within the active beat, advanced by the render loop. */
  beatProgress: number
  autoplay: boolean
  freeLook: boolean
  /** Axis symbol the reader is pointing at, so chip and legend highlight together. */
  hoveredAxis: string | null
  data: Record<string, unknown>

  loadPack: (pack: ModelPack, data: Record<string, unknown>) => void
  goToChapter: (index: number) => void
  goToBeat: (chapterIndex: number, beatIndex: number) => void
  next: () => void
  previous: () => void
  setBeatProgress: (progress: number) => void
  toggleAutoplay: () => void
  toggleFreeLook: () => void
  setHoveredAxis: (axis: string | null) => void
}

export const useExplainer = create<ExplainerState>((set, get) => ({
  pack: null,
  chapterIndex: 0,
  beatIndex: 0,
  beatProgress: 0,
  autoplay: true,
  freeLook: false,
  hoveredAxis: null,
  data: {},

  loadPack: (pack, data) => set({ pack, data }),

  goToChapter: (index) => set({ chapterIndex: index, beatIndex: 0, beatProgress: 0 }),

  goToBeat: (chapterIndex, beatIndex) => set({ chapterIndex, beatIndex, beatProgress: 0 }),

  next: () => {
    const { pack, chapterIndex, beatIndex } = get()
    if (!pack) return
    const chapter = pack.chapters[chapterIndex]
    if (beatIndex + 1 < chapter.beats.length) {
      set({ beatIndex: beatIndex + 1, beatProgress: 0 })
    } else if (chapterIndex + 1 < pack.chapters.length) {
      set({ chapterIndex: chapterIndex + 1, beatIndex: 0, beatProgress: 0 })
    }
  },

  previous: () => {
    const { pack, chapterIndex, beatIndex } = get()
    if (!pack) return
    if (beatIndex > 0) {
      set({ beatIndex: beatIndex - 1, beatProgress: 0 })
    } else if (chapterIndex > 0) {
      const previousChapter = pack.chapters[chapterIndex - 1]
      set({
        chapterIndex: chapterIndex - 1,
        beatIndex: previousChapter.beats.length - 1,
        beatProgress: 0,
      })
    }
  },

  setBeatProgress: (progress) => set({ beatProgress: progress }),

  toggleAutoplay: () => set({ autoplay: !get().autoplay }),

  toggleFreeLook: () => set({ freeLook: !get().freeLook }),

  setHoveredAxis: (axis) => set({ hoveredAxis: axis }),
}))

/** The axis glossary entry for a symbol, or null if the pack does not define one. */
export const useAxis = (symbol: string) =>
  useExplainer((s) => s.pack?.axes[symbol] ?? null)

export const useActiveChapter = (): Chapter | null => {
  const pack = useExplainer((s) => s.pack)
  const index = useExplainer((s) => s.chapterIndex)
  return pack ? pack.chapters[index] : null
}

export const useActiveBeat = (): Beat | null => {
  const chapter = useActiveChapter()
  const index = useExplainer((s) => s.beatIndex)
  return chapter ? chapter.beats[index] : null
}

/** Read a JSON payload the pack declared in its data manifest. */
export const usePackData = <T,>(key: string): T | null =>
  useExplainer((s) => (s.data[key] as T) ?? null)
