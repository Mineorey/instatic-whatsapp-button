// Browser test for the info panel. Uses an installed Edge/Chrome via
// playwright-core (WAB_BROWSER_CHANNEL, default msedge).
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from 'playwright-core'
import { processPage } from '../../server/lib/button.js'

const require = createRequire(import.meta.url)
const css = readFileSync(new URL('../../frontend/contact-button.css', import.meta.url), 'utf8')
const js = readFileSync(new URL('../../frontend/contact-button.js', import.meta.url), 'utf8')
const axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const SETTINGS = { phone: '+49301234567', mode: 'dialog', privacyUrl: '/datenschutz#whatsapp', message: 'Hallo' }
const page = (settings, withScript = true) => processPage(
  `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>T</title><style>${css}</style></head>` +
  `<body><main><h1>Test</h1><p><a href="#x" id="before">Link davor</a></p><div style="height:2000px"></div></main></body></html>`,
  settings, { slug: 'index' }).html.replace('</body>', withScript ? `<script>${js}</script></body>` : '</body>')

let browser
before(async () => { browser = await chromium.launch({ channel: process.env.WAB_BROWSER_CHANNEL || 'msedge' }) })
after(async () => { await browser?.close() })

async function open(settings = SETTINGS, viewport = { width: 390, height: 780 }) {
  const p = await browser.newPage({ viewport })
  await p.setContent(page(settings))
  return p
}
const state = (p) => p.evaluate(() => ({
  open: document.getElementById('wab-panel').hasAttribute('data-open'),
  expanded: document.querySelector('.wab').getAttribute('aria-expanded'),
  active: document.activeElement.className || document.activeElement.id,
  visible: getComputedStyle(document.getElementById('wab-panel')).visibility,
}))

test('click opens the panel instead of navigating, focus moves into it', async () => {
  const p = await open()
  assert.equal(await p.locator('.wab').getAttribute('role'), 'button')
  await p.click('.wab')
  await p.waitForTimeout(250)
  assert.deepEqual(await state(p), { open: true, expanded: 'true', active: 'wab-panel wab--right wab--small', visible: 'visible' })
  assert.equal(p.url(), 'about:blank')
  await p.close()
})

test('Escape closes and returns focus to the button', async () => {
  const p = await open()
  await p.focus('.wab')
  await p.keyboard.press('Enter')
  assert.equal((await state(p)).open, true)
  await p.keyboard.press('Tab')
  assert.equal(await p.evaluate(() => document.activeElement.className), 'wab-panel__close')
  await p.keyboard.press('Escape')
  const s = await state(p)
  assert.equal(s.open, false)
  assert.equal(s.expanded, 'false')
  assert.match(s.active, /^wab /)
  await p.close()
})

test('Space toggles, close button and outside click close', async () => {
  const p = await open()
  await p.focus('.wab')
  await p.keyboard.press(' ')
  assert.equal((await state(p)).open, true)
  await p.click('.wab-panel__close')
  assert.equal((await state(p)).open, false)
  await p.click('.wab')
  await p.mouse.click(30, 200)
  assert.equal((await state(p)).open, false)
  await p.close()
})

test('CTA is the real wa.me link and opens in a new tab', async () => {
  const p = await open()
  await p.click('.wab')
  const cta = p.locator('.wab-panel__cta')
  assert.equal(await cta.getAttribute('href'), 'https://wa.me/49301234567?text=Hallo')
  assert.equal(await cta.getAttribute('target'), '_blank')
  assert.equal(await cta.getAttribute('rel'), 'noopener noreferrer')
  await p.close()
})

test('closed panel is hidden from assistive tech and pointer', async () => {
  const p = await open()
  assert.equal((await state(p)).visible, 'hidden')
  const tree = await p.locator('body').ariaSnapshot()
  assert.doesNotMatch(tree, /Chat in WhatsApp öffnen/)
  await p.close()
})

test('without script the button stays a plain link and the panel is not shown', async () => {
  const p = await browser.newPage()
  await p.setContent(page(SETTINGS, false))
  assert.equal(await p.locator('.wab').getAttribute('role'), null)
  assert.equal(await p.evaluate(() => getComputedStyle(document.getElementById('wab-panel')).display), 'none')
  await p.close()
})

test('panel fits on a small phone and above the button', async () => {
  const p = await open(SETTINGS, { width: 320, height: 568 })
  await p.click('.wab')
  await p.waitForTimeout(250)
  const panel = await p.locator('#wab-panel').boundingBox()
  const btn = await p.locator('.wab').boundingBox()
  assert.ok(panel.x >= 0 && panel.x + panel.width <= 320, JSON.stringify(panel))
  assert.ok(panel.y >= 0 && panel.y + panel.height <= btn.y, JSON.stringify({ panel, btn }))
  await p.close()
})

test('axe: no WCAG 2.1 A/AA or best-practice violations with the panel open (both variants)', async () => {
  for (const variant of ['white', 'black']) {
    const p = await open({ ...SETTINGS, variant })
    await p.click('.wab')
    await p.waitForTimeout(250)
    await p.addScriptTag({ content: axe })
    const res = await p.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }))
    const v = res.violations.map((x) => `${x.id}: ${x.nodes.map((n) => n.target.join(' ')).join(', ')}`)
    assert.deepEqual(v, [], variant)
    await p.close()
  }
})

test('hostile site CSS loaded after ours: focus radius and [role=button] min size do not deform the button', async () => {
  const hostile = '*,:focus-visible{border-radius:4px}button,[role="button"]{min-height:60px;min-width:60px}svg{height:auto}'
  const p = await open({ ...SETTINGS, size: 'xsmall' })
  await p.addStyleTag({ content: hostile })
  await p.focus('.wab')
  const r = await p.locator('.wab').evaluate((e) => { const s = getComputedStyle(e); return { w: e.offsetWidth, h: e.offsetHeight, radius: s.borderRadius } })
  assert.deepEqual(r, { w: 40, h: 40, radius: '50%' })
  await p.click('.wab')
  const c = await p.locator('.wab-panel__close').evaluate((e) => ({ w: e.offsetWidth, h: e.offsetHeight }))
  assert.deepEqual(c, { w: 36, h: 36 })
  await p.close()
})

test('prefers-reduced-motion: no transitions', async () => {
  const p = await open()
  await p.emulateMedia({ reducedMotion: 'reduce' })
  const t = await p.evaluate(() => [document.querySelector('.wab'), document.getElementById('wab-panel')].map((e) => getComputedStyle(e).transitionDuration))
  assert.deepEqual(t, ['0s', '0s'])
  await p.close()
})
