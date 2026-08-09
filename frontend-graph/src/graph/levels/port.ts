import type { GraphNode } from '../types'

/** A tensor crossing the boundary of an opened level, drawn as a small chip. */
export function port(
  group: string,
  name: string,
  symbolic: string,
  side: 'in' | 'out',
  concrete?: number[],
): GraphNode {
  return {
    id: `${group}:${side}:${name}`,
    label: name,
    module: symbolic,
    kind: 'port',
    group,
    side,
    summary: concrete ? `${symbolic} = ${concrete.join(' × ')}` : symbolic,
  }
}

/** The id `port()` produced, for writing edges without repeating the pattern. */
export const portId = (group: string, name: string, side: 'in' | 'out'): string =>
  `${group}:${side}:${name}`
