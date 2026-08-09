import type { InspectableTensor } from './types'

/**
 * The honest label on the picture: which module produced it, what its real shape
 * was, what was thrown away to make it 2-D, and whether the values mean anything
 * given the weights this walkthrough ran on.
 */
export const Provenance = ({ tensor }: { tensor: InspectableTensor }) => {
  const source = tensor.provenance
  const [rows, columns] = [tensor.matrix.length, tensor.matrix[0]?.length ?? 0]

  if (!source) {
    return (
      <dl className="provenance">
        <Row term="drawn" detail={`${rows} × ${columns}`} />
        <Row term="source" detail="not recorded by the extractor" />
      </dl>
    )
  }

  return (
    <dl className="provenance">
      <Row term="module" detail={<code>{source.qualifiedName ?? source.module}</code>} />
      {source.algorithm && <Row term="paper" detail={source.algorithm} />}
      <Row term="full shape" detail={<code>[{source.fullShape.join(', ')}]</code>} />
      <Row term="drawn" detail={`${rows} × ${columns} — ${source.reduction}`} />
      <Row
        term={source.statistics ? 'full tensor' : 'drawn matrix'}
        detail={describe(source.statistics ?? summarise(tensor.matrix))}
      />
      <Row
        term="colour"
        detail="2nd–98th percentile of the drawn matrix, so outliers do not flatten it"
      />
      <Row
        term="trained?"
        detail={
          source.dependsOnWeights
            ? 'this walkthrough runs randomly initialised weights, so treat the values as a demonstration of shape and range, not as a prediction'
            : 'the pattern here is fixed by the input encoding, not learned — a trained model would show the same structure. The magnitudes still come from an untrained projection of it.'
        }
      />
      {source.note && <Row term="note" detail={source.note} />}
    </dl>
  )
}

type Statistics = NonNullable<InspectableTensor['provenance']>['statistics']

const describe = (statistics: NonNullable<Statistics>): string =>
  `min ${statistics.min} · max ${statistics.max} · mean ${statistics.mean} · std ${statistics.std} · ${statistics.elements.toLocaleString()} values`

/** Fallback for matrices the extractor did not summarise before reducing. */
const summarise = (matrix: number[][]): NonNullable<Statistics> => {
  const values = matrix.flat()
  const mean = values.reduce((total, value) => total + value, 0) / (values.length || 1)
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) / (values.length || 1)
  return {
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
    mean: round(mean),
    std: round(Math.sqrt(variance)),
    elements: values.length,
  }
}

const round = (value: number): number => Math.round(value * 10000) / 10000

const Row = ({ term, detail }: { term: string; detail: React.ReactNode }) => (
  <div className="provenance-row">
    <dt>{term}</dt>
    <dd>{detail}</dd>
  </div>
)
