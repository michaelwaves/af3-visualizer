import type { Payloads } from './types'

const NAMES = [
  'trace',
  'maps',
  'source',
  'msa',
  'predictions',
  'diffusion',
  'structure',
  'model',
  'template',
] as const

export const dataUrl = (name: string): string => `${import.meta.env.BASE_URL}data/${name}.json`

/** Loads every payload the walkthrough needs before the first paint. */
export async function loadPayloads(): Promise<Payloads> {
  const documents = await Promise.all(NAMES.map((name) => fetchJson(dataUrl(name))))
  return Object.fromEntries(
    NAMES.map((name, index) => [name, documents[index]]),
  ) as unknown as Payloads
}

/** Fetches one full-precision tensor, only when somebody asks to see it. */
export async function loadTensor(id: string): Promise<unknown> {
  return fetchJson(`${import.meta.env.BASE_URL}data/tensors/${id}.json`)
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} — ${response.status} ${response.statusText}`)
  return response.json()
}
