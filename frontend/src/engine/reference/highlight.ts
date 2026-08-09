const KEYWORDS =
  /\b(def|class|return|if|else|elif|for|in|not|and|or|is|None|True|False|import|from|as|with|lambda|yield|assert|while|break|continue|pass|raise|try|except|finally|self)\b/

/** Ordered so earlier patterns win: strings and comments swallow everything else. */
const RULES: [string, RegExp][] = [
  ['comment', /#[^\n]*/],
  ['string', /(?:'''[\s\S]*?'''|"""[\s\S]*?"""|'[^'\n]*'|"[^"\n]*")/],
  ['decorator', /@[\w.]+/],
  ['keyword', KEYWORDS],
  ['number', /\b\d+\.?\d*(?:e-?\d+)?\b/],
  ['call', /\b[A-Za-z_]\w*(?=\()/],
]

const PATTERN = new RegExp(RULES.map(([, rule]) => `(${rule.source})`).join('|'), 'g')

export interface Token {
  text: string
  kind: string | null
}

/**
 * A deliberately small Python tokeniser. Full syntax highlighting would mean a
 * dependency several times the size of this whole panel; the code is displayed
 * for reading, not editing.
 */
export const tokenize = (code: string): Token[] => {
  const tokens: Token[] = []
  let cursor = 0

  for (const match of code.matchAll(PATTERN)) {
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ text: code.slice(cursor, index), kind: null })
    const group = match.slice(1).findIndex((value) => value !== undefined)
    tokens.push({ text: match[0], kind: RULES[group]?.[0] ?? null })
    cursor = index + match[0].length
  }

  if (cursor < code.length) tokens.push({ text: code.slice(cursor), kind: null })
  return tokens
}
