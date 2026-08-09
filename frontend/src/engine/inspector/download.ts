import type { InspectableTensor } from './types'

/** Serialises exactly the matrix on screen — no hidden reprocessing. */
export const toCsv = (matrix: number[][]): string =>
  matrix.map((row) => row.join(',')).join('\n')

export const toJson = (tensor: InspectableTensor): string =>
  JSON.stringify(
    {
      name: tensor.key,
      shape: [tensor.matrix.length, tensor.matrix[0]?.length ?? 0],
      provenance: tensor.provenance,
      values: tensor.matrix,
    },
    null,
    2,
  )

export const download = (filename: string, contents: string, mime: string): void => {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
