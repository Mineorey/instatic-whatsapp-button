# Changelog

## 1.1.1

- Button und Hinweis-Fenster stehen in einem eigenen Seitenbereich (`<aside aria-label="WhatsApp-Kontakt">`). Damit meldet axe keinen Inhalt außerhalb von Landmarks mehr (Best Practice „region“).
- Browsertest prüft zusätzlich die axe-Best-Practices.

## 1.1.0

- Neu: Verhalten „Erst Hinweis-Fenster zeigen“ – kleines Chatfenster mit Überschrift, eigenem Text, WhatsApp-Link und optionalem Datenschutz-Link. Ohne JavaScript bleibt der Button ein direkter Link.
- Frontend-Dateien neutral benannt (`contact-button.css/.js`), damit Filterlisten sie nicht sperren.
- Robuster gegen Website-CSS (Mindestgrößen für `[role=button]`, Eckenradien bei `:focus-visible`).
- Browsertests mit axe-Prüfung.

## 1.0.0

- Schwebender Click-to-Chat-Button (wa.me) mit offiziellem WhatsApp-Glyph, Farb-, Größen- und Positionswahl.
