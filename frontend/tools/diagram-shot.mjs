/** Screenshots the architecture diagram at a few chapters, to check the wiring.
 *
 *   node tools/diagram-shot.mjs http://localhost:5185 shots/
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.argv[2] ?? 'http://localhost:5185'
const outDir = process.argv[3] ?? 'shots'

/** Clicking each of these boxes should jump to its chapter and light it up. */
const STOPS = [
  'input-embedder',
  'template-module',
  'msa-module',
  'pairformer',
  'diffusion-module',
  'confidence-module',
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1760, height: 1000 }, deviceScaleFactor: 2 })

const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push(String(e)))

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.diagram-svg', { timeout: 30_000 })
await page.waitForTimeout(1200)

// The diagram on its own, cropped, so the geometry is easy to check.
await page.locator('.diagram').screenshot({ path: `${outDir}/diagram.png` })

const problemsBefore = problems.length
for (const id of STOPS) {
  const box = page.locator(`.diagram-node`).nth(await indexOf(page, id))
  await box.click()
  await page.waitForTimeout(500)
  const lit = await page.locator('.diagram-node-active .diagram-label').allTextContents()
  const chapter = await page.locator('.narrative h2, .narrative h1').first().textContent()
  console.log(`  click ${id.padEnd(18)} lit: ${(lit.join(' / ') || '(none)').padEnd(34)} chapter: ${chapter}`)
  if (!lit.length) problems.push(`clicking ${id} lit nothing`)
  await page.screenshot({ path: `${outDir}/${id}.png` })
}
if (problems.length === problemsBefore) console.log('  every box lit its own stage')

// Hovering a box should explain it in the footnote.
await page.locator('.diagram-node-clickable').nth(1).hover()
await page.waitForTimeout(250)
console.log(`  hover footnote: ${await page.locator('.diagram-standfirst').innerText()}`)

/** Diagram nodes are drawn in declaration order, so find this one's index. */
async function indexOf(page, id) {
  return page.evaluate((wanted) => {
    const order = [...document.querySelectorAll('.diagram-node')]
    return order.findIndex((node) => node.dataset.id === wanted)
  }, id)
}

console.log(problems.length ? `\nERRORS:\n${problems.join('\n')}` : '\nno console errors')
await browser.close()
