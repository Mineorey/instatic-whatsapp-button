import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizePhone, readConfig, chatUrl, processPage } from '../../server/lib/button.js'

const PAGE = '<!doctype html><html><head></head><body><main>x</main></body></html>'

test('normalizePhone: common German formats', () => {
  for (const raw of ['+49 30 1234567', '+49 (0)30 123-4567', '0049 30 1234567', '030 1234567', '030/1234567']) {
    assert.deepEqual(normalizePhone(raw, '49'), { ok: true, digits: '49301234567' }, raw)
  }
})

test('normalizePhone: errors', () => {
  assert.equal(normalizePhone('', '49').ok, false)
  assert.equal(normalizePhone('030 1234567', '').ok, false)
  assert.equal(normalizePhone('123', '49').ok, false)
  assert.equal(normalizePhone('+49 1234567890123456', '49').ok, false)
})

test('number without country code is kept as given (user must add it)', () => {
  // "301234567" has no leading 0 or +, so it is taken literally – this is
  // the wrong link https://wa.me/301234567 the settings text warns about.
  assert.equal(normalizePhone('301234567', '49').digits, '301234567')
})

test('chatUrl encodes the message', () => {
  assert.equal(chatUrl('49123456789', ''), 'https://wa.me/49123456789')
  assert.equal(chatUrl('49123456789', 'Hallo & tschüss'), 'https://wa.me/49123456789?text=Hallo%20%26%20tsch%C3%BCss')
})

test('readConfig falls back to defaults', () => {
  const c = readConfig({ position: 'oben', size: 'riesig', label: '  ', excludeSlugs: ' /Datenschutz/, impressum ' })
  assert.equal(c.position, 'right')
  assert.equal(c.size, 'small')
  assert.equal(c.label, 'Chat über WhatsApp öffnen (externer Dienst)')
  assert.deepEqual(c.excluded, ['datenschutz', 'impressum'])
  assert.equal(c.enabled, true)
})

test('processPage injects one accessible link before </body>', () => {
  const r = processPage(PAGE, { phone: '+49 30 1234567' }, { slug: 'kontakt' })
  assert.equal(r.error, undefined)
  assert.match(r.html, /<a class="wab wab--right wab--small wab--white" href="https:\/\/wa\.me\/49301234567" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" aria-label="Chat über WhatsApp öffnen \(externer Dienst\)"/)
  assert.match(r.html, /aria-hidden="true"/)
  assert.ok(r.html.indexOf('wab:end -->') < r.html.indexOf('</body>'))
  assert.doesNotMatch(r.html, /<script/)
})

test('processPage is idempotent and removes the button when disabled/excluded/invalid', () => {
  const once = processPage(PAGE, { phone: '+49301234567' }, { slug: 'index' }).html
  const twice = processPage(once, { phone: '+49301234567' }, { slug: 'index' }).html
  assert.equal(once, twice)
  assert.equal(processPage(once, { phone: '+49301234567', enabled: false }, { slug: 'index' }).html, PAGE)
  assert.equal(processPage(once, { phone: '+49301234567', excludeSlugs: 'index' }, { slug: '' }).html, PAGE)
  const bad = processPage(once, { phone: '' }, { slug: 'index' })
  assert.equal(bad.html, PAGE)
  assert.ok(bad.error)
})

test('processPage escapes settings', () => {
  const r = processPage(PAGE, { phone: '+49301234567', label: '"><script>x</script>', newTab: false }, { slug: 'a' })
  assert.doesNotMatch(r.html, /<script>/)
  assert.doesNotMatch(r.html, /target=/)
})

test('variant falls back to white; black is allowed', () => {
  assert.equal(readConfig({ variant: 'pink' }).variant, 'white')
  assert.match(processPage(PAGE, { phone: '+49301234567', variant: 'black' }, {}).html, /wab--black/)
})

test('official glyph: two unchanged paths in a 720 viewBox', () => {
  const html = processPage(PAGE, { phone: '+49301234567' }, {}).html
  assert.match(html, /viewBox="0 0 720 720"/)
  assert.equal((html.match(/<path d=/g) || []).length, 2)
})

test('direct mode renders no panel', () => {
  const html = processPage(PAGE, { phone: '+49301234567' }, {}).html
  assert.doesNotMatch(html, /wab-panel|data-wab-panel/)
})

test('dialog mode renders trigger + panel with escaped text and paragraphs', () => {
  const html = processPage(PAGE, {
    phone: '+49301234567', mode: 'dialog', dialogTitle: 'Fragen? <b>',
    dialogText: 'Zeile 1\nZeile 2\n\nAbsatz <script>x</script>', ctaLabel: 'Los', privacyUrl: '/datenschutz#whatsapp',
  }, {}).html
  assert.match(html, /<a class="wab [^"]*" href="https:\/\/wa\.me\/49301234567"[^>]* data-wab-panel="wab-panel" aria-label="Fragen\? &lt;b&gt;"/)
  assert.match(html, /<div class="wab-panel wab--right wab--small" id="wab-panel" role="dialog" aria-modal="false" aria-labelledby="wab-panel-title" tabindex="-1">/)
  assert.match(html, /<p>Zeile 1<br>Zeile 2<\/p><p>Absatz &lt;script&gt;x&lt;\/script&gt;<\/p>/)
  assert.match(html, /<a class="wab-panel__cta" href="https:\/\/wa\.me\/49301234567" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">/)
  assert.match(html, /<a href="\/datenschutz#whatsapp">Hinweise zum Datenschutz<\/a>/)
  assert.doesNotMatch(html, /<script>/)
})

test('privacy link only accepts site paths and http(s)', () => {
  assert.equal(readConfig({ privacyUrl: 'javascript:alert(1)' }).privacyUrl, '')
  assert.equal(readConfig({ privacyUrl: '//evil.example' }).privacyUrl, '')
  assert.equal(readConfig({ privacyUrl: 'https://example.com/ds' }).privacyUrl, 'https://example.com/ds')
  const html = processPage(PAGE, { phone: '+49301234567', mode: 'dialog' }, {}).html
  assert.doesNotMatch(html, /wab-panel__privacy/)
})

test('dialog mode is idempotent', () => {
  const s = { phone: '+49301234567', mode: 'dialog' }
  const once = processPage(PAGE, s, {}).html
  assert.equal(processPage(once, s, {}).html, once)
  assert.equal(processPage(once, { ...s, enabled: false }, {}).html, PAGE)
})
