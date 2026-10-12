// Optional info panel for the WhatsApp button (setting "Hinweis-Fenster
// zuerst"). Progressive enhancement: the trigger is a normal wa.me link and
// only opens the panel once this script runs. Nothing is stored, nothing is
// loaded from WhatsApp before the visitor clicks the link inside the panel.
(function () {
  'use strict'
  var trigger = document.querySelector('a.wab[data-wab-panel]')
  if (!trigger) return
  var panel = document.getElementById(trigger.getAttribute('data-wab-panel'))
  if (!panel) return
  var close = panel.querySelector('.wab-panel__close')
  var cta = panel.querySelector('.wab-panel__cta')

  trigger.setAttribute('role', 'button')
  trigger.setAttribute('aria-haspopup', 'dialog')
  trigger.setAttribute('aria-controls', panel.id)
  trigger.setAttribute('aria-expanded', 'false')
  panel.setAttribute('data-ready', '')

  function isOpen() { return panel.hasAttribute('data-open') }

  function open() {
    panel.setAttribute('data-open', '')
    trigger.setAttribute('aria-expanded', 'true')
    // focus the panel itself so screen readers announce title and text
    // first; the WhatsApp link is the next Tab stop
    panel.focus({ preventScroll: true })
  }

  function hide(returnFocus) {
    if (!isOpen()) return
    panel.removeAttribute('data-open')
    trigger.setAttribute('aria-expanded', 'false')
    if (returnFocus) trigger.focus({ preventScroll: true })
  }

  trigger.addEventListener('click', function (e) {
    // keep ctrl/cmd/shift/middle click as "open link in new tab/window"
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    e.stopPropagation()
    if (isOpen()) hide(false); else open()
  })
  // role=button: Space activates as well (Enter already fires click)
  trigger.addEventListener('keydown', function (e) {
    if (e.key === ' ') { e.preventDefault(); trigger.click() }
  })

  if (close) close.addEventListener('click', function () { hide(true) })
  if (cta) cta.addEventListener('click', function () { setTimeout(function () { hide(false) }, 0) })

  // the site may close overlays on any document click; keep clicks inside
  // the panel to the panel
  panel.addEventListener('click', function (e) { e.stopPropagation() })

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) hide(panel.contains(document.activeElement) || document.activeElement === trigger)
  })
  document.addEventListener('pointerdown', function (e) {
    if (isOpen() && !panel.contains(e.target) && !trigger.contains(e.target)) hide(false)
  })
  // non-modal: leaving the panel with Tab closes it again
  panel.addEventListener('focusout', function (e) {
    var to = e.relatedTarget
    if (to && !panel.contains(to) && to !== trigger) hide(false)
  })
})()
