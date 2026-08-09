import { rampFromStops } from './scene/texture'

/**
 * One palette for the whole engine. Colours encode *what kind of thing* a tensor
 * is, so the same hue means the same role in every chapter — and in every pack.
 */
export const palette = {
  background: '#07080b',
  surface: '#0e1015',
  line: '#1e222c',
  text: '#e6e8ee',
  muted: '#8b93a5',

  single: '#f0a05a', // per-token vectors
  pair: '#4fd1c5', // per-token-pair matrices
  msa: '#7bd88f', // multiple sequence alignment
  atom: '#a78bfa', // per-atom features
  template: '#e879a6', // structural templates
  noise: '#f472b6', // diffusion noise
  structure: '#60a5fa', // predicted coordinates
  confidence: '#fbbf24',
} as const

export type Role = keyof typeof palette

export const ramps = {
  pair: rampFromStops(['#08131a', '#0d4a52', '#2f9e93', '#7fe3d2', '#e8fffb']),
  msa: rampFromStops(['#0a1410', '#1e5136', '#3f9c5f', '#8fd99b', '#e9fbec']),
  single: rampFromStops(['#150c05', '#5c2f10', '#c2701f', '#f0a05a', '#ffe3c4']),
  atom: rampFromStops(['#0f0a1c', '#3a2a6b', '#7a5fd4', '#a78bfa', '#e6dcff']),
  noise: rampFromStops(['#0b0710', '#57134e', '#be185d', '#f472b6', '#fce7f3']),
  /** Diverging, for signed values such as attention logits or coordinates. */
  signed: rampFromStops(['#4fd1c5', '#134e4a', '#0b0d12', '#5b2333', '#f472b6']),
  /** The standard AlphaFold pLDDT ramp: orange = unconfident, blue = confident. */
  plddt: rampFromStops(['#ff7d45', '#ffdb13', '#65cbf3', '#0053d6']),
} as const

/** Colour a residue by pLDDT using AlphaFold's published bands. */
export const plddtColor = (score: number): string => {
  if (score >= 90) return '#0053d6'
  if (score >= 70) return '#65cbf3'
  if (score >= 50) return '#ffdb13'
  return '#ff7d45'
}
