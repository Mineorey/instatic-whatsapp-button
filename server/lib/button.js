// Pure helpers: phone normalisation, link and markup. No host API in here,
// so the unit tests can import this file directly.

// Official WhatsApp glyph (Meta Brand Resource Center, Digital_Glyph_*_RGB_2026.svg),
// paths unchanged, 720×720 viewBox. Colour comes from CSS (currentColor).
export const GLYPH = ['M360,0C161.18,0,0,161.18,0,360c0,65.41,17.45,126.75,47.94,179.61L0,720l187.02-44.21c51.34,28.18,110.28,44.21,172.98,44.21,198.82,0,360-161.18,360-360S558.82,0,360,0ZM360,655.52c-60.17,0-116.13-17.98-162.82-48.87l-110.49,28.14,30.99-105.61c-33.53-47.93-53.2-106.26-53.2-169.19,0-163.21,132.31-295.52,295.52-295.52s295.52,132.31,295.52,295.52-132.31,295.52-295.52,295.52Z','M444.35,407.52l87.1,41.06c4,1.88,6.56,5.94,6.2,10.34-.94,11.46-5.54,34.43-26.13,55.02-58.12,58.12-162.49-7.64-166.74-10.18-25.67-13.79-50.06-32.24-73.19-55.36s-41.58-47.52-55.37-73.19c-2.55-4.24-68.31-108.61-10.18-166.74,20.59-20.59,43.56-25.19,55.02-26.13,4.41-.36,8.46,2.2,10.34,6.2l41.07,87.1c1.94,4.12,1.09,9.02-2.13,12.24l-30.61,30.61c-6.62,6.62-8.56,16.93-4,25.11,11.17,20.03,26.19,39.32,43.59,57.07,17.75,17.4,37.04,32.43,57.07,43.59,8.18,4.56,18.48,2.62,25.11-4l30.61-30.61c3.22-3.22,8.12-4.08,12.24-2.13Z']

export const DEFAULTS = {
  enabled: true,
  phone: '',
  defaultCountry: '49',
  message: '',
  label: 'Chat über WhatsApp öffnen (externer Dienst)',
  variant: 'white',
  position: 'right',
  size: 'small',
  newTab: true,
  excludeSlugs: '',
  mode: 'direct',
  dialogTitle: 'Kontakt über WhatsApp',
  dialogText: 'Sie haben eine Frage? Schreiben Sie uns über WhatsApp.\n\nMit dem Klick auf den Button verlassen Sie diese Website. WhatsApp ist ein Dienst von Meta.',
  ctaLabel: 'Chat in WhatsApp öffnen',
  privacyUrl: '',
  privacyLabel: 'Hinweise zum Datenschutz',
}

const SIZES = ['xsmall', 'small', 'medium']
const VARIANTS = ['white', 'black']
const MODES = ['direct', 'dialog']

// wa.me wants the full international number: digits only, no "+", no "00",
// no national trunk zero. "+49 (0)30 123-4567", "0049 30 1234567" and
// "030 1234567" (with defaultCountry 49) all become "49301234567".
export function normalizePhone(raw, defaultCountry) {
  let s = String(raw || '').trim()
  if (!s) return { ok: false, error: 'Keine Telefonnummer eingetragen.' }
  s = s.replace(/\(0\)/g, '')
  const plus = s.startsWith('+')
  let d = s.replace(/\D/g, '')
  if (plus) { /* already international */ }
  else if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) {
    const cc = String(defaultCountry || '').replace(/\D/g, '')
    if (!cc) return { ok: false, error: 'Nummer beginnt mit 0, aber keine Ländervorwahl eingestellt.' }
    d = cc + d.slice(1)
  }
  if (d.startsWith('0')) return { ok: false, error: 'Ungültige Nummer (führende Null nach der Ländervorwahl).' }
  // E.164: at most 15 digits; a country code plus subscriber number is at least 8
  if (d.length < 8 || d.length > 15) return { ok: false, error: `Ungültige Länge (${d.length} Ziffern).` }
  return { ok: true, digits: d }
}

export function readConfig(settings) {
  const s = { ...DEFAULTS }
  for (const k of Object.keys(DEFAULTS)) if (settings && settings[k] !== undefined && settings[k] !== null && settings[k] !== '') s[k] = settings[k]
  s.enabled = s.enabled !== false && s.enabled !== 'false'
  s.newTab = s.newTab !== false && s.newTab !== 'false'
  if (s.position !== 'left') s.position = 'right'
  if (!SIZES.includes(s.size)) s.size = 'small'
  if (!VARIANTS.includes(s.variant)) s.variant = 'white'
  if (!MODES.includes(s.mode)) s.mode = 'direct'
  for (const k of ['label', 'dialogTitle', 'ctaLabel', 'privacyLabel']) s[k] = String(s[k]).trim() || DEFAULTS[k]
  s.dialogText = String(s.dialogText).trim()
  // only same-site paths or http(s) URLs; anything else (javascript: …) is dropped
  s.privacyUrl = String(s.privacyUrl || '').trim()
  if (s.privacyUrl && !/^(\/(?!\/)|https?:\/\/)/i.test(s.privacyUrl)) s.privacyUrl = ''
  s.excluded = String(s.excludeSlugs || '').split(/[\s,;]+/).map((x) => x.replace(/^\/+|\/+$/g, '').toLowerCase()).filter(Boolean)
  return s
}

export function chatUrl(digits, message) {
  const text = String(message || '').trim()
  return `https://wa.me/${digits}` + (text ? `?text=${encodeURIComponent(text)}` : '')
}

function escAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const MARK_START = '<!-- wab:start -->'
const MARK_END = '<!-- wab:end -->'
const BLOCK = /<!-- wab:start -->[\s\S]*?<!-- wab:end -->/g

function escText(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function glyph(cls) {
  return `<svg class="${cls}" viewBox="0 0 720 720" width="24" height="24" aria-hidden="true" focusable="false" fill="currentColor">` +
    GLYPH.map((d) => `<path d="${d}"/>`).join('') + '</svg>'
}

// Blank lines start a new paragraph, single line breaks stay line breaks.
export function paragraphs(text) {
  return String(text || '').replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => '<p>' + escText(p).replace(/\n/g, '<br>') + '</p>').join('')
}

const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>'

// The panel is part of the page but stays invisible until contact-button.js
// opens it. Without script the button stays a plain link to WhatsApp.
function panelHtml(cfg, href, linkAttrs) {
  const privacy = cfg.privacyUrl
    ? `<p class="wab-panel__privacy"><a href="${escAttr(cfg.privacyUrl)}">${escText(cfg.privacyLabel)}</a></p>`
    : ''
  return `<div class="wab-panel wab--${cfg.position} wab--${cfg.size}" id="wab-panel" role="dialog" aria-modal="false" aria-labelledby="wab-panel-title" tabindex="-1">` +
    '<div class="wab-panel__head">' +
    `<span class="wab-panel__avatar wab--${cfg.variant}">` + glyph('wab-panel__avatar-icon') + '</span>' +
    `<p class="wab-panel__title" id="wab-panel-title">${escText(cfg.dialogTitle)}</p>` +
    '<button type="button" class="wab-panel__close" aria-label="Schließen">' + CLOSE_ICON + '</button>' +
    '</div>' +
    (cfg.dialogText ? `<div class="wab-panel__bubble">${paragraphs(cfg.dialogText)}</div>` : '') +
    `<a class="wab-panel__cta" href="${href}"${linkAttrs}>` + glyph('wab-panel__cta-icon') + `<span>${escText(cfg.ctaLabel)}</span></a>` +
    privacy +
    '</div>'
}

export function buttonHtml(cfg, digits) {
  const href = escAttr(chatUrl(digits, cfg.message))
  const linkAttrs = (cfg.newTab ? ' target="_blank"' : '') + ' rel="noopener noreferrer" referrerpolicy="no-referrer"'
  const dialog = cfg.mode === 'dialog'
  // complementary landmark, so the button is not content outside any region
  // (axe best practice "region"); the aside itself has no box
  return MARK_START + '<aside class="wab-region" aria-label="WhatsApp-Kontakt">' +
    `<a class="wab wab--${cfg.position} wab--${cfg.size} wab--${cfg.variant}" href="${href}"${linkAttrs}` +
    (dialog ? ' data-wab-panel="wab-panel"' : '') +
    // in dialog mode the trigger is named after the panel; the script adds
    // aria-haspopup/aria-expanded, without script it is still a fine link name
    ` aria-label="${escAttr(dialog ? cfg.dialogTitle : cfg.label)}" title="${escAttr(dialog ? cfg.dialogTitle : cfg.label)}">` + glyph('wab__icon') + '</a>' +
    (dialog ? panelHtml(cfg, href, linkAttrs) : '') +
    '</aside>' + MARK_END
}

function slugOf(ctx) {
  return String((ctx && ctx.slug) || '').replace(/^\/+|\/+$/g, '').toLowerCase() || 'index'
}

// Returns { html, error }. Idempotent: an earlier block is always removed first.
export function processPage(html, settings, ctx) {
  if (typeof html !== 'string') return { html }
  const clean = html.replace(BLOCK, '')
  const cfg = readConfig(settings)
  if (!cfg.enabled || cfg.excluded.includes(slugOf(ctx))) return { html: clean }
  const phone = normalizePhone(cfg.phone, cfg.defaultCountry)
  if (!phone.ok) return { html: clean, error: phone.error }
  const i = clean.toLowerCase().lastIndexOf('</body>')
  if (i < 0) return { html: clean }
  return { html: clean.slice(0, i) + buttonHtml(cfg, phone.digits) + clean.slice(i) }
}
