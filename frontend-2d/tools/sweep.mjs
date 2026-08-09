/** Visits every step and every panel, and reports anything broken or empty.
 *
 *   node tools/sweep.mjs http://localhost:5183
 */
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:5183'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1680, height: 1020 } })
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`))
page.on('pageerror', (e) => problems.push(`pageerror: ${e}`))
page.on('requestfailed', (r) => problems.push(`request failed: ${r.url()}`))

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForSelector('.stage__title')

const total = Number((await page.locator('.crumb__step').innerText()).match(/of (\d+)/)[1])
console.log(`sweeping ${total} steps, every panel each offers`)

const empties = []
for (let index = 0; index < total; index += 1) {
  await page.fill('.terminal__input', `goto ${index + 1}`)
  await page.press('.terminal__input', 'Enter')
  await page.waitForTimeout(90)

  const title = await page.locator('.stage__title').innerText()
  if (!title.trim()) problems.push(`step ${index + 1}: empty title`)
  const inScope = await page.locator('.scope__list .var').count()
  if (inScope === 0) problems.push(`step ${index + 1}: no variables in scope`)

  const shown = await page.locator('.tabs__tab').allInnerTexts()
  for (const tab of shown) {
    await page.click(`.tabs__tab:has-text("${tab}")`)
    await page.waitForTimeout(tab === 'Raw tensor' ? 260 : 60)
    const body = (await page.locator('.panel__body').innerText()).trim()
    if (!body) problems.push(`step ${index + 1} (${title}) · ${tab}: blank panel`)
    if (await page.locator('.panel__body .panel__empty').count()) empties.push(`${index + 1} ${tab}`)
    if (body.includes('Could not load')) problems.push(`step ${index + 1} · ${tab}: ${body.slice(0, 90)}`)
    if (body.includes('Loading the recorded tensor')) problems.push(`step ${index + 1} · ${tab}: still loading`)
  }
}

console.log(`\n${empties.length} intentionally-empty panels (step · tab):`)
console.log('  ' + empties.join(', '))
console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n  ${problems.join('\n  ')}` : '\nno problems')
await browser.close()
process.exit(problems.length ? 1 : 0)
