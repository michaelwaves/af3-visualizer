/** Screenshots a few steps of the walkthrough, to check it actually renders.
 *
 *   node tools/shoot.mjs http://localhost:5183 out/
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.argv[2] ?? 'http://localhost:5183'
const outDir = process.argv[3] ?? 'shots'

const SHOTS = [
  { name: '01-open', step: null, tab: null },
  { name: '02-tokenise', step: 'tokenise', tab: 'Math' },
  { name: '03-outer-product', step: 'outer_product_mean', tab: 'Activations' },
  { name: '04-tri-mult-code', step: 'tri_mult_outgoing', tab: 'Code' },
  { name: '05-pairformer-stack', step: 'pairformer_stack', tab: 'Activations' },
  { name: '06-diffusion-tensor', step: 'diffusion_module', tab: 'Raw tensor' },
  { name: '07-confidence', step: 'confidence_head', tab: 'Measured data' },
  { name: '09-msa', step: 'msa_search', tab: 'Measured data' },
  { name: '10-schedule', step: 'edm_schedule', tab: 'Measured data' },
  { name: '11-precond', step: 'preconditioning', tab: 'Measured data' },
  { name: '12-trajectory', step: 'edm_sample', tab: 'Measured data' },
  { name: '13-distogram', step: 'distogram_head', tab: 'Measured data' },
  { name: '14-template', step: 'template_features', tab: 'Measured data' },
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1680, height: 1020 }, deviceScaleFactor: 2 })

const problems = []
page.on('console', (message) => message.type() === 'error' && problems.push(message.text()))
page.on('pageerror', (error) => problems.push(String(error)))

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.stage__title', { timeout: 30_000 })

for (const shot of SHOTS) {
  if (shot.step) {
    await page.fill('.terminal__input', `goto ${shot.step}`)
    await page.press('.terminal__input', 'Enter')
    await page.waitForTimeout(250)
  }
  if (shot.tab) {
    await page.click(`.tabs__tab:has-text("${shot.tab}")`)
    await page.waitForTimeout(450)
    await page.locator('.panel--tabs').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
  }
  await page.screenshot({ path: `${outDir}/${shot.name}.png` })
  console.log(`  ${shot.name}  ${await page.locator('.stage__title').innerText()}`)
}

// Hover an axis symbol so the glossary card is captured too.
await page.locator('.flow__column--out .dim').first().hover()
await page.waitForTimeout(350)
await page.screenshot({ path: `${outDir}/08-hover-glossary.png` })

console.log(problems.length ? `\nconsole errors:\n${problems.join('\n')}` : '\nno console errors')
await browser.close()
