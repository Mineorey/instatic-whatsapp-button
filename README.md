# WhatsApp Button for Instatic

A small, free, MIT-licensed **floating click-to-chat button** for the [Instatic CMS](https://github.com/corebunch/instatic) (plugin id `filmorbit.whatsapp-button`). It links to `https://wa.me/<number>` and can optionally show a short info panel first, so visitors know what happens before they leave your site.

**Deutsch:** Kleiner schwebender WhatsApp-Button (Click to Chat, wa.me) für Instatic. Wahlweise öffnet ein Klick direkt WhatsApp oder zuerst ein kleines Hinweis-Fenster mit eigenem Text, WhatsApp-Link und Link zur Datenschutzerklärung. Datensparsam: kein Widget, keine Verbindung zu WhatsApp vor dem Klick, keine Cookies – deshalb kein Eintrag im Cookie-Banner nötig. Oberfläche und Einstellungen auf Deutsch.

Made by [FilmOrbit](https://filmorbit.de).

## What it does

- Adds a round button with the official WhatsApp glyph to the bottom right (or left) corner of every published page. Three sizes: 40/44, 44/48 (default) and 52/56 px on mobile/desktop.
- **Direct mode** (default): a click opens WhatsApp. On phones the chat opens in the WhatsApp app; on desktop WhatsApp shows its own page to continue in WhatsApp Desktop or WhatsApp Web.
- **Info panel mode**: a click opens a small chat-style panel above the button with a title, your text, a "Chat in WhatsApp öffnen" link and an optional link to your privacy policy. Only that link leads to WhatsApp.
- Normalises the phone number: `+49 30 1234567`, `0049 30 1234567` and `030 1234567` (with country code 49) all become `https://wa.me/49301234567`. An optional pre-filled message is appended as `?text=`.
- Can be hidden on selected pages.

## Privacy by design

- The button is a **plain link** with a locally served SVG. No widget, no third-party script, font or image.
- Nothing is sent to WhatsApp/Meta when a page loads or when the panel opens – only when the visitor clicks the WhatsApp link.
- `rel="noopener noreferrer"` and `referrerpolicy="no-referrer"`: WhatsApp does not learn which page the click came from.
- No cookies, no local storage.
- Without JavaScript the button stays a direct link to WhatsApp.

Because nothing is stored on the device and nothing is transmitted before the click, the button itself needs no consent under § 25 TDDDG / ePrivacy in our assessment. Your privacy policy still has to describe the WhatsApp contact (provider, data WhatsApp processes on its own behalf, transfers to the USA). This is not legal advice.

## Requirements

- Instatic with plugin `apiVersion` 1. Tested with Instatic as of October 2026.
- Node.js 22 or newer to build and test the package.

## Installation

1. Download `filmorbit.whatsapp-button-<version>.zip` from the [releases](https://github.com/Mineorey/instatic-whatsapp-button/releases), or build it yourself: `npm install`, `npm test`, `npm run build` (the zip lands in `dist/`).
2. Upload it under **Admin → Plugins → Install plugin** and confirm the permissions.
3. Fill in the settings, at least the **WhatsApp-Nummer**.
4. **Re-publish the whole site.** Button and panel are written into the HTML at publish time; every settings change needs a new publish.
5. Check the generated link as an admin: `/admin/api/cms/plugins/filmorbit.whatsapp-button/runtime/preview`.

| Permission | Purpose |
|---|---|
| `cms.hooks` | `publish.html` filter: insert button (and panel) before `</body>` |
| `frontend.assets` | load `frontend/contact-button.css` and `frontend/contact-button.js` |
| `cms.routes` | admin route `/preview` to check the link |

The frontend files deliberately do not contain "whatsapp" in their names, because some ad-blocker filter lists block such files.

## Settings

| Setting | Meaning |
|---|---|
| Button anzeigen | turn the button off on all pages (after publishing) |
| WhatsApp-Nummer | international format, e.g. `+49 30 1234567`. **wa.me needs the country code**, without `+` and without leading zero. A number without `+` or `0` is used as is. |
| Ländervorwahl | used for numbers starting with a single `0`, default `49` |
| Vorausgefüllte Nachricht | optional pre-filled message |
| Beschriftung für Screenreader | accessible name of the button in direct mode |
| Verhalten beim Klick | direct to WhatsApp, or info panel first |
| Hinweis-Fenster: Überschrift | panel title, also the button's accessible name in panel mode |
| Hinweis-Fenster: Text | plain text; a blank line starts a new paragraph |
| Hinweis-Fenster: Link-Text | default "Chat in WhatsApp öffnen" |
| Hinweis-Fenster: Datenschutz-Link | optional; a path (`/datenschutz#whatsapp`) or an `https://` URL |
| Hinweis-Fenster: Text des Datenschutz-Links | default "Hinweise zum Datenschutz" |
| Farbvariante | white glyph on green (default) or black glyph on green (high contrast, about 9:1) |
| Position | bottom right / bottom left |
| Größe | very small, small (default), medium |
| In neuem Tab öffnen | default on |
| Auf diesen Seiten ausblenden | page slugs, comma-separated; the home page is `index` |

If the number is invalid, no button is inserted and the plugin log says why.

## Design and accessibility

- Green circle (#25D366) with the **official WhatsApp glyph** from the Meta Brand Resource Center (2026), paths unchanged, no effects on the logo. Colours only from the official set: green #25D366, white, black #111B21.
- Contrast: white on #25D366 is only about 2:1. The button has an accessible name; if you read WCAG 1.4.11 strictly, choose the black variant. The link inside the panel uses dark text on green (8.8:1).
- The panel inherits the site's font, is at most 320 px wide and fits 320 px phones.
- Keyboard: Enter or Space opens the panel and moves focus into it; Tab reaches "Schließen" and the WhatsApp link; Escape closes it and returns focus to the button. Clicking outside or tabbing out also closes it. Ctrl/Cmd-click on the button still opens WhatsApp directly in a new tab.
- `z-index: 50`, below typical navigation, menus, overlays and cookie banners.
- Respects the iPhone safe area, `prefers-reduced-motion` and forced-colors mode; hidden when printing; robust against common site rules such as minimum sizes for `[role=button]` or border radii on `:focus-visible`.
- Tested with axe-core: no WCAG 2.1 A/AA violations with the panel open.

## Development

- `npm test` – unit tests (number normalisation, markup, escaping)
- `npm run test:browser` – panel behaviour in a real browser via playwright-core, including an axe check. Uses an installed Microsoft Edge; set `WAB_BROWSER_CHANNEL=chrome` to use Chrome.
- `npm run build` – bundles the server code for Instatic's sandbox and packs the zip into `dist/`.

## Trademarks

WhatsApp and the WhatsApp logo are trademarks of WhatsApp LLC. This plugin is not affiliated with, endorsed or sponsored by WhatsApp or Meta. The glyph is used unmodified as provided in the [Meta Brand Resource Center](https://www.meta.com/brand/resources/whatsapp/whatsapp-brand/); it is **not** covered by the MIT license of this project. Please follow the WhatsApp brand guidelines when you use the plugin.

## License

MIT for the code, see [LICENSE](LICENSE). The WhatsApp glyph is excluded (see Trademarks).
