/** Screenshots each level of the graph, and fails loudly on console errors.
 *
 *   node tools/shoot.mjs http://localhost:5184 shots/
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.argv[2] ?? 'http://localhost:5184'
const outDir = process.argv[3] ?? 'shots'

/** [name, node to open — `search:<label>` or `canvas:<label>` — and node to select] */
const SHOTS = [
  ['01-root', null, null],
  ['02-root-selected', null, 'Trunk'],
  ['03-input-embedder', 'Input embedder', 'Atom transformer'],
  ['04-trunk', 'Trunk', 'MSA module'],
  ['05-msa-module', 'MSA module', 'Outer product mean'],
  ['06-pairformer', 'Pairformer stack', 'Pairwise block'],
  ['07-pairwise-block', 'canvas:Pairwise block', 'Triangle attn, starting'],
  ['08-edm', 'Diffusion sampler', 'Denoiser'],
  ['09-denoiser', 'Denoiser', 'Token transformer'],
  ['10-confidence', 'Confidence head', 'pLDDT'],
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1720, height: 1040 }, deviceScaleFactor: 2 })

const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push(String(e)))
page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`))

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.node')

const jump = async (label) => {
  await page.fill('.search__input', label)
  await page.waitForSelector('.search__results button')
  await page.click(`.search__results button:has(.search__label:text-is("${label}"))`)
  await page.waitForTimeout(700)
}

for (const [name, openLabel, selectLabel] of SHOTS) {
  if (openLabel?.startsWith('canvas:')) {
    // Several nodes share a label, so open this one by its button on the canvas.
    await page.click(`.node:has(.node__label:text-is("${openLabel.slice(7)}")) .node__open`)
    await page.waitForTimeout(700)
  } else if (openLabel) await jump(openLabel)
  if (selectLabel) {
    await page.click(`.node:has(.node__label:text-is("${selectLabel}"))`)
    await page.waitForTimeout(400)
  }
  const nodes = await page.locator('.node, .port').count()
  await page.screenshot({ path: `${outDir}/${name}.png` })
  console.log(`  ${name}  ${await page.locator('.crumbs__link.is-current').innerText()}  (${nodes} nodes)`)
}

console.log(problems.length ? `\nERRORS:\n${problems.join('\n')}` : '\nno console errors')
await browser.close()
