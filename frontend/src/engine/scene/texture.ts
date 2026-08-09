import { DataTexture, LinearFilter, NearestFilter, RGBAFormat, UnsignedByteType } from 'three'

export type Ramp = (t: number) => [number, number, number]

/** Builds an RGBA texture from row-major values, normalised to the given range. */
export const matrixTexture = (
  values: ArrayLike<number>,
  width: number,
  height: number,
  ramp: Ramp,
  range?: [number, number],
  smooth = false,
): DataTexture => {
  const [low, high] = range ?? robustExtent(values)
  const span = high - low || 1
  const pixels = new Uint8Array(width * height * 4)

  for (let index = 0; index < width * height; index++) {
    const normalised = clamp01((Number(values[index] ?? 0) - low) / span)
    const [r, g, b] = ramp(normalised)
    pixels.set([r * 255, g * 255, b * 255, 255], index * 4)
  }

  const texture = new DataTexture(pixels, width, height, RGBAFormat, UnsignedByteType)
  texture.magFilter = smooth ? LinearFilter : NearestFilter
  texture.minFilter = LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

/** Builds a texture from category indices and a lookup table of hex colours. */
export const categoricalTexture = (
  categories: number[][],
  lookup: string[],
  fade?: (row: number, column: number) => number,
): DataTexture => {
  const height = categories.length
  const width = categories[0]?.length ?? 1
  const pixels = new Uint8Array(width * height * 4)

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const hex = lookup[categories[row][column]] ?? '#12141a'
      const alpha = fade ? clamp01(fade(row, column)) : 1
      const offset = (row * width + column) * 4
      pixels.set(
        [
          parseInt(hex.slice(1, 3), 16) * alpha,
          parseInt(hex.slice(3, 5), 16) * alpha,
          parseInt(hex.slice(5, 7), 16) * alpha,
          255,
        ],
        offset,
      )
    }
  }

  const texture = new DataTexture(pixels, width, height, RGBAFormat, UnsignedByteType)
  texture.magFilter = NearestFilter
  texture.minFilter = LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

/**
 * Percentile range rather than min/max. Real activations have long tails — a
 * single outlier flattens a whole matrix to one colour, which hides the
 * structure the chapter is pointing at.
 */
export const robustExtent = (values: ArrayLike<number>, tail = 0.02): [number, number] => {
  const finite: number[] = []
  for (let index = 0; index < values.length; index++) {
    const value = Number(values[index])
    if (Number.isFinite(value)) finite.push(value)
  }
  if (!finite.length) return [0, 1]

  finite.sort((a, b) => a - b)
  const low = finite[Math.floor(finite.length * tail)]
  const high = finite[Math.min(finite.length - 1, Math.ceil(finite.length * (1 - tail)))]
  return high > low ? [low, high] : extent(values)
}

export const extent = (values: ArrayLike<number>): [number, number] => {
  let low = Infinity
  let high = -Infinity
  for (let index = 0; index < values.length; index++) {
    const value = Number(values[index])
    if (!Number.isFinite(value)) continue
    if (value < low) low = value
    if (value > high) high = value
  }
  return Number.isFinite(low) ? [low, high] : [0, 1]
}

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
]

/** Piecewise-linear ramp through a list of hex stops. */
export const rampFromStops = (stops: string[]): Ramp => {
  const colors = stops.map(hexToRgb)
  return (t) => {
    const scaled = clamp01(t) * (colors.length - 1)
    const index = Math.min(colors.length - 2, Math.floor(scaled))
    const fraction = scaled - index
    const from = colors[index]
    const to = colors[index + 1]
    return [
      from[0] + (to[0] - from[0]) * fraction,
      from[1] + (to[1] - from[1]) * fraction,
      from[2] + (to[2] - from[2]) * fraction,
    ]
  }
}
