/** Opens every node on every level and every drawer tab, reporting anything broken.
 *
 *   node tools/sweep.mjs http://localhost:5184
 */
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:5184'
/** Each level, reached the way a reader reaches it: by opening group nodes. */
const LEVELS = [
  ['root', []],
  ['input_embedder', ['Input embedder']],
  ['trunk', ['Trunk']],
  ['template_embedder', ['Trunk', 'Template embedder']],
  ['msa_module', ['Trunk', 'MSA module']],
  ['pairformer', ['Trunk', 'Pairformer stack']],
  ['pairformer_block', ['Trunk', 'Pairformer stack', 'Pairwise block']],
  ['edm', ['Diffusion sampler']],
  ['diffusion_module', ['Diffusion sampler', 'Denoiser']],
  ['confidence_head', ['Confidence head']],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1720, height: 1040 } })
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
page.on('pageerror', (e) => problems.push(`pageerror: ${e}`))
page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`))

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.node')

let nodesSeen = 0
let tabsSeen = 0

for (const [levelId, path] of LEVELS) {
  await page.click('.crumbs__link:text-is("Alphafold3.forward")')
  await page.waitForTimeout(220)
  for (const label of path) {
    await page.click(`.node:has(.node__label:text-is("${label}")) .node__open`)
    await page.waitForTimeout(360)
  }
  const count = await page.locator('.node, .port').count()
  if (count === 0) problems.push(`${levelId}: no nodes rendered`)

  for (let index = 0; index < count; index += 1) {
    await page.locator('.node, .port').nth(index).click()
    await page.waitForTimeout(60)
    const title = (await page.locator('.drawer__title').innerText().catch(() => '')).trim()
    if (!title) {
      problems.push(`${levelId}: node ${index} opened an empty drawer`)
      continue
    }
    nodesSeen += 1

    const tabs = await page.locator('.tabs__tab').allInnerTexts()
    for (const tab of tabs) {
      await page.click(`.tabs__tab:text-is("${tab}")`)
      await page.waitForTimeout(tab === 'Activation' ? 160 : 40)
      const body = (await page.locator('.drawer__body').innerText()).trim()
      if (!body) problems.push(`${levelId} · ${title} · ${tab}: blank`)
      tabsSeen += 1
    }
  }
  console.log(`  ${levelId.padEnd(20)} ${count} nodes`)
}

console.log(`\n${nodesSeen} nodes inspected, ${tabsSeen} drawer tabs opened`)
console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n  ${problems.join('\n  ')}` : '\nno problems')
await browser.close()
process.exit(problems.length ? 1 : 0)
