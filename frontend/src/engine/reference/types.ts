/** Types for the documentation surfaces: pipeline map, maths, code and inputs. */

/** One step of the model's forward pass, named after the code that runs it. */
export interface PipelineStage {
  id: string
  label: string
  /** The class actually invoked, e.g. `PairformerStack`. */
  module: string
  /** Where it lives, for people who want to go read it. */
  qualifiedName?: string
  algorithm?: string
  /** Marks stages that run inside the recycling loop. */
  loop?: boolean
  note?: string
}

/** One typeset expression, with the symbols it introduces spelled out. */
export interface Equation {
  /** Short title, e.g. "triangle multiplication, outgoing". */
  label: string
  /** KaTeX source, rendered in display mode. */
  latex: string
  /** Optional prose tying the equation back to the code. */
  note?: string
  /** Symbol glossary shown beneath, e.g. `z_{ij}` → "pair representation". */
  where?: { symbol: string; meaning: string }[]
}

/** The maths and the implementation behind one chapter. */
export interface ChapterReference {
  equations?: Equation[]
  /** Keys into the pack's source snippets, in reading order. */
  snippets?: string[]
}

/** A verbatim excerpt of the model's own source. */
export interface SourceSnippet {
  symbol: string
  file: string
  startLine: number
  endLine: number
  lines: number
  code: string
}

/** An input file shipped verbatim so it can be read and downloaded. */
export interface RawInput {
  key: string
  label: string
  format: string
  /** 'model input', 'reference only' or 'model output'. */
  role: string
  /** URL relative to the site root. */
  path: string
  /** Where the file lives in the model repository. */
  repositoryPath: string
  bytes: number
  lines: number
  truncated: boolean
  shownRecords?: number
  totalRecords?: number
  note?: string
}

export interface SourceIndex {
  repository: string
  commit: string | null
  snippets: Record<string, SourceSnippet>
}
