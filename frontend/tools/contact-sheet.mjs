// Screenshots one beat from every chapter, for reviewing all scenes at once.
//   node tools/contact-sheet.mjs <outputDir> [beatIndex]
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const [dir = 'shots', beat = '99', url = 'http://127.0.0.1:5177/'] = process.argv.slice(2)
await mkdir(dir, { recursive: true })

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1500, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))

await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(2500)

const chapters = await page.evaluate(() => {
  window.__explainer.getState().toggleAutoplay()
  return window.__explainer.getState().pack.chapters.map((chapter) => chapter.id)
})

for (const [index, id] of chapters.entries()) {
  await page.evaluate(
    ([chapterIndex, beatIndex]) => {
      const state = window.__explainer.getState()
      const count = state.pack.chapters[chapterIndex].beats.length
      state.goToBeat(chapterIndex, Math.min(Number(beatIndex), count - 1))
    },
    [index, beat],
  )
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${dir}/${String(index).padStart(2, '0')}-${id}.png` })
  console.log(`shot ${id}`)
}

if (errors.length) console.log('PAGE ERRORS:\n' + [...new Set(errors)].slice(0, 12).join('\n'))
await browser.close()
