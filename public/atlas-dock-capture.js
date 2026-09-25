/* Dock assist. HUD / red outline / FIRED labels only when ?debug=1 or window.__ATLAS_DEBUG__. */
(function atlasDockCapture() {
  if (window.__atlasDockCaptureInstalled) return
  window.__atlasDockCaptureInstalled = true
  window.__atlasCaptureMounted = true
  window.__atlasToolQueue = window.__atlasToolQueue || []
  window.__atlasLastToolbarEvent = window.__atlasLastToolbarEvent || 'capture: mounted'
  window.__atlasLastPointer = '—'
  window.__atlasMuteUntil = 0

  function isDebug() {
    try {
      if (window.__ATLAS_DEBUG__ === true) return true
      return new URLSearchParams(location.search).get('debug') === '1'
    } catch {
      return false
    }
  }

  var BAND = 120
  var lastMoveDock = false

  var LABELS = {
    reset: 'TOOLBAR RESET FIRED',
    focus: 'TOOLBAR FOCUS FIRED',
    isolate: 'TOOLBAR ISOLATE FIRED',
    'card-focus': 'CARD FOCUS FIRED',
  }

  function paintHud() {
    if (!isDebug()) {
      var stale = document.getElementById('atlas-hud')
      if (stale) stale.remove()
      return
    }
    var el = document.getElementById('atlas-hud')
    if (!el) {
      el = document.createElement('div')
      el.id = 'atlas-hud'
      el.setAttribute('data-atlas-hud', '')
      el.style.cssText =
        'position:fixed;left:10px;top:10px;z-index:99999;pointer-events:none;max-width:min(92vw,48rem);border-radius:6px;background:rgb(11 13 16 / 0.92);color:#E8E4DC;border:1px solid #3AD1C7;padding:6px 10px;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.4;white-space:pre-wrap'
      if (document.body) document.body.appendChild(el)
      else return
    }
    var r = dockRect()
    var focus = toolBox('focus')
    var reset = toolBox('reset')
    var isolate = toolBox('isolate')
    el.textContent =
      'captureMounted: ' +
      (window.__atlasCaptureMounted ? 'yes' : 'no') +
      '\nlastPointer: ' +
      window.__atlasLastPointer +
      '\nlastToolbarEvent: ' +
      window.__atlasLastToolbarEvent +
      '\ndockRect: ' +
      fmtRect(r) +
      '\nfocusRect: ' +
      fmtRect(focus) +
      '\nfocusCenter: ' +
      fmtCenter(focus) +
      '\ncenters: reset ' +
      fmtCenter(reset) +
      ' · isolate ' +
      fmtCenter(isolate)
    paintDockOutline(lastMoveDock)
  }

  window.__atlasPaintHud = paintHud

  function flushReflow() {
    void document.documentElement.offsetWidth
    if (document.body) void document.body.offsetWidth
  }

  function pointInRect(x, y, r, slop) {
    slop = slop || 0
    return x >= r.left - slop && x <= r.right + slop && y >= r.top - slop && y <= r.bottom + slop
  }

  function fmtRect(r) {
    if (!r) return '—'
    return (
      Math.round(r.left) +
      ',' +
      Math.round(r.top) +
      '–' +
      Math.round(r.right) +
      ',' +
      Math.round(r.bottom)
    )
  }

  function fmtCenter(r) {
    if (!r) return '—'
    return Math.round((r.left + r.right) / 2) + ',' + Math.round((r.top + r.bottom) / 2)
  }

  function toolBox(name) {
    flushReflow()
    var el = document.querySelector('[data-atlas-tool="' + name + '"]')
    if (!el) return null
    var r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return null
    return r
  }

  function liveDockEl() {
    return document.querySelector('[data-atlas-dock]')
  }

  function dockRect() {
    flushReflow()
    var dock = liveDockEl()
    if (dock) {
      var r = dock.getBoundingClientRect()
      if (r.height > 4 && r.width > 4) return r
    }
    return {
      left: 0,
      top: window.innerHeight - BAND,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: BAND,
    }
  }

  function inDockGeom(x, y) {
    return pointInRect(x, y, dockRect(), 8)
  }

  function hostRect() {
    var host = document.querySelector('[data-atlas-canvas-host]')
    if (host) return host.getBoundingClientRect()
    var canvas = document.querySelector('canvas')
    return canvas ? canvas.getBoundingClientRect() : null
  }

  function treatAsDock(x, y) {
    return inDockGeom(x, y)
  }

  function firstVisibleRect(nodes) {
    flushReflow()
    for (var i = 0; i < nodes.length; i++) {
      var r = nodes[i].getBoundingClientRect()
      if (r.width >= 2 && r.height >= 2) return r
    }
    return null
  }

  function cardFocusBox() {
    return firstVisibleRect(document.querySelectorAll('[data-atlas-focus="card"]'))
  }

  function cardPanelBox() {
    return firstVisibleRect(document.querySelectorAll('[data-atlas-selection-card]'))
  }

  function inCardFocus(x, y) {
    var r = cardFocusBox()
    return !!(r && pointInRect(x, y, r, 8))
  }

  function inCardPanel(x, y) {
    var r = cardPanelBox()
    return !!(r && pointInRect(x, y, r, 4))
  }

  function cardCloseButton(x, y) {
    flushReflow()
    var nodes = document.querySelectorAll('[data-atlas-close="card"]')
    for (var i = 0; i < nodes.length; i++) {
      var r = nodes[i].getBoundingClientRect()
      if (r.width >= 2 && r.height >= 2 && pointInRect(x, y, r, 6)) return nodes[i]
    }
    return null
  }

  function fromCardFocusNode(e) {
    var t = e.target
    if (t && t.closest) {
      var btn = t.closest('[data-atlas-focus="card"]')
      if (btn) return true
    }
    return false
  }

  function hitKind(x, y) {
    if (treatAsDock(x, y)) return 'dock'
    var host = hostRect()
    if (host && pointInRect(x, y, host, 0)) return 'canvas'
    return 'other'
  }

  function paintDockOutline(inside) {
    var dock = liveDockEl()
    if (!dock) return
    if (!isDebug()) {
      dock.style.outline = ''
      dock.style.outlineOffset = ''
      return
    }
    dock.style.outline = inside ? '3px solid #ff2a2a' : '2px dashed rgba(255,60,60,0.55)'
    dock.style.outlineOffset = '2px'
  }

  /** Thirds of the toolbar pill only. The dock band left of the pill is not Reset. */
  function toolNameAt(x, y) {
    flushReflow()
    var bar = document.querySelector('[data-atlas-toolbar]')
    if (!bar) return null
    var r = bar.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) return null
    if (!pointInRect(x, y, r, 10)) return null
    var t = (x - r.left) / r.width
    if (t < 1 / 3) return 'reset'
    if (t < 2 / 3) return 'focus'
    return 'isolate'
  }

  function releaseEveryCapture(pointerId) {
    var all = document.querySelectorAll('*')
    var ids = pointerId != null ? [pointerId] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    for (var i = 0; i < all.length; i++) {
      var node = all[i]
      if (typeof node.hasPointerCapture !== 'function') continue
      for (var k = 0; k < ids.length; k++) {
        try {
          if (node.hasPointerCapture(ids[k])) node.releasePointerCapture(ids[k])
        } catch {
          /* ignore */
        }
      }
    }
  }

  function setCanvasLive(on) {
    var list = document.querySelectorAll('canvas, [data-atlas-canvas-host]')
    for (var i = 0; i < list.length; i++) {
      list[i].style.pointerEvents = on ? 'auto' : 'none'
    }
  }

  function fireTool(name) {
    if (!name || !LABELS[name]) return
    window.__atlasLastToolbarEvent = LABELS[name]
    paintHud()
    if (typeof window.__atlasRunTool === 'function') {
      window.__atlasRunTool(name)
    } else {
      window.__atlasToolQueue.push(name)
    }
  }

  function fromToolNode(e) {
    var t = e.target
    if (t && t.closest) {
      var btn = t.closest('[data-atlas-tool]')
      if (btn) return btn.getAttribute('data-atlas-tool')
    }
    return null
  }

  function onPointer(e) {
    if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return
    var x = e.clientX
    var y = e.clientY

    if (e.type === 'pointermove' || e.type === 'mousemove') {
      lastMoveDock = inDockGeom(x, y)
      paintDockOutline(lastMoveDock)
      if (lastMoveDock || inCardPanel(x, y) || inCardFocus(x, y)) {
        releaseEveryCapture(e.pointerId)
        setCanvasLive(false)
      } else {
        setCanvasLive(true)
      }
      return
    }

    if (fromCardFocusNode(e) || inCardFocus(x, y)) {
      window.__atlasLastPointer = Math.round(x) + ',' + Math.round(y) + ' → hit=card-focus'
      paintHud()
      releaseEveryCapture(e.pointerId)
      setCanvasLive(false)
      if (e.type === 'pointerdown') fireTool('card-focus')
      return
    }

    var dock = treatAsDock(x, y)
    var hit = dock ? 'dock' : hitKind(x, y)
    window.__atlasLastPointer = Math.round(x) + ',' + Math.round(y) + ' → hit=' + hit
    paintHud()
    paintDockOutline(dock)

    if (!dock) {
      setCanvasLive(true)
      return
    }

    if (e.type !== 'pointerdown') return

    if (inCardPanel(x, y)) {
      window.__atlasLastPointer = Math.round(x) + ',' + Math.round(y) + ' → hit=card'
      paintHud()
      releaseEveryCapture(e.pointerId)
      setCanvasLive(false)
      var closeBtn = cardCloseButton(x, y)
      if (closeBtn) closeBtn.click()
      return
    }

    releaseEveryCapture(e.pointerId)
    setCanvasLive(false)
    fireTool(fromToolNode(e) || toolNameAt(x, y))
  }

  var types = ['pointerdown', 'pointercancel']
  for (var t = 0; t < types.length; t++) {
    window.addEventListener(types[t], onPointer, true)
  }
  window.addEventListener('pointermove', onPointer, true)
  window.addEventListener('mousemove', onPointer, true)

  function boot() {
    paintHud()
    paintDockOutline(false)
    var n = 0
    var id = setInterval(function () {
      paintHud()
      paintDockOutline(false)
      if (++n > 24) clearInterval(id)
    }, 250)
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
