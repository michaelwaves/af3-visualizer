/** Walks the opening chapter beat by beat, so the first screen can be eyeballed.
 *
 *   node tools/opening-shot.mjs http://localhost:5185 shots/
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.argv[2] ?? 'http://localhost:5185'
const outDir = process.argv[3] ?? 'shots'

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1760, height: 1000 }, deviceScaleFactor: 2 })

const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push(String(e)))

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.diagram-svg', { timeout: 30_000 })
await page.click('text=pause').catch(() => {})
await page.waitForTimeout(2000)

for (let beat = 0; beat < 6; beat += 1) {
  const chapter = await page.locator('.narrative h2, .narrative h1').first().textContent()
  await page.screenshot({ path: `${outDir}/open-${beat}.png` })
  console.log(`  beat ${beat}  chapter: ${chapter?.trim()}`)
  await page.click('text=next')
  await page.waitForTimeout(1400)
}

// Collapsed state, to check the bar shrinks to just its control row.
await page.click('.diagram-toggle')
await page.waitForTimeout(500)
const height = await page.locator('.diagram').evaluate((el) => Math.round(el.getBoundingClientRect().height))
console.log(`  collapsed bar height: ${height}px`)
await page.screenshot({ path: `${outDir}/collapsed.png` })
await page.click('.diagram-toggle')
await page.waitForTimeout(500)
const open = await page.locator('.diagram').evaluate((el) => Math.round(el.getBoundingClientRect().height))
console.log(`  open bar height: ${open}px`)

console.log(problems.length ? `\nERRORS:\n${problems.join('\n')}` : '\nno console errors')
await browser.close()
