/** Splits a long string into fixed-width rows, the way a sequence viewer would. */
export const wrap = (text: string, columns: number): string[] => {
  const rows: string[] = []
  for (let start = 0; start < text.length; start += columns) {
    rows.push(text.slice(start, start + columns))
  }
  return rows
}
