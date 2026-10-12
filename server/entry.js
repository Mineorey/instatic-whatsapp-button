import { processPage, readConfig, normalizePhone, chatUrl } from './lib/button.js'

// The button is plain HTML written into every page at publish time: no
// script, no request to WhatsApp before the visitor clicks. Changing the
// settings therefore needs a new publish.
let lastError = null

function logOnce(api, text) {
  if (lastError === text) return
  lastError = text
  if (text) api.plugin.log(text)
}

export function activate(api) {
  api.cms.hooks.filter('publish.html', async (html, ctx) => {
    try {
      const r = processPage(html, api.cms.settings.getAll() || {}, ctx)
      logOnce(api, r.error ? `whatsapp-button: kein Button eingefügt – ${r.error}` : null)
      return r.html
    } catch (err) {
      logOnce(api, `whatsapp-button: Fehler (${err && err.message}); Seite ohne Button veröffentlicht`)
      return html
    }
  })

  // Admin check of the resulting link: /admin/api/cms/plugins/<id>/runtime/preview
  api.cms.routes.get('/preview', 'plugins.read', async () => {
    const cfg = readConfig(api.cms.settings.getAll() || {})
    const phone = normalizePhone(cfg.phone, cfg.defaultCountry)
    return phone.ok
      ? { ok: true, enabled: cfg.enabled, url: chatUrl(phone.digits, cfg.message), excluded: cfg.excluded }
      : { ok: false, enabled: cfg.enabled, error: phone.error }
  })
}
