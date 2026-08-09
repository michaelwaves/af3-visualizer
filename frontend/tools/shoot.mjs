// Screenshots one beat per invocation, for eyeballing scenes during development.
//   node tools/shoot.mjs <chapterIndex> <beatIndex> <outfile>
import { chromium } from 'playwright'

const [chapter = '0', beat = '0', out = 'shot.png', url = 'http://127.0.0.1:5177/'] =
  process.argv.slice(2)

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
const errors = []
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
page.on('pageerror', (error) => errors.push(String(error)))

await page.goto(url, { waitUntil: 'load' })
await page.waitForTimeout(2500)

await page.evaluate(
  ([chapterIndex, beatIndex]) => {
    const store = window.__explainer
    if (!store) throw new Error('explainer store not exposed')
    store.getState().toggleAutoplay()
    store.getState().goToBeat(Number(chapterIndex), Number(beatIndex))
  },
  [chapter, beat],
)
await page.waitForTimeout(3200)
await page.screenshot({ path: out })
if (errors.length) console.log('PAGE ERRORS:\n' + errors.slice(0, 10).join('\n'))
await browser.close()
