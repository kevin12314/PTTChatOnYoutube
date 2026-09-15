// The current terminal renders to Canvas; older versions expose DOM rows.
export function readTerminalRows (pageWindow, currentDocument) {
  const buf = pageWindow.app && pageWindow.app.buf
  if (buf && typeof buf.getRowText === 'function') {
    return Array.from({ length: buf.rows }, (_, row) => buf.getRowText(row, 0, buf.cols))
  }
  return Array.from(currentDocument.querySelectorAll("[data-type='bbsline']"), line => line.textContent)
}

export function bindTerminalUpdates (pageWindow, onUpdate) {
  let attached = false
  let backgroundTimer
  let updateTimer = null
  const scheduleUpdate = () => {
    if (updateTimer !== null) return
    // A buffer flush can emit both events. Advance the task only once.
    updateTimer = pageWindow.setTimeout(() => {
      updateTimer = null
      onUpdate()
    }, 0)
  }
  const attach = () => {
    const app = pageWindow.app
    if (!app || !app.buf || typeof app.buf.on !== 'function') return false
    // Only disable the terminal's competing login UI for this embedded session.
    const autoLogin = typeof app.getPlugin === 'function' &&
      (app.getPlugin('login_assist') || app.getPlugin('auto_login'))
    if (autoLogin) {
      autoLogin.hide()
      autoLogin.setEnabled(false, false)
    }
    app.buf.on('viewUpdate', scheduleUpdate)
    app.buf.on('cursor-move', scheduleUpdate)
    // Hidden iframes suspend requestAnimationFrame, which the terminal uses
    // to flush its buffer. Flush pending data without waiting for a repaint.
    backgroundTimer = pageWindow.setInterval(() => {
      flushPendingTerminalUpdate(app.buf)
    }, 100)
    attached = true
    onUpdate()
    return true
  }
  const originalLog = pageWindow.console.log
  function log (...args) {
    originalLog.apply(pageWindow.console, args)
    if (!attached && args[0] === 'view update') onUpdate()
  }
  pageWindow.console.log = log
  let timer
  if (!attach()) {
    timer = pageWindow.setInterval(() => {
      if (attach()) pageWindow.clearInterval(timer)
    }, 100)
  }
  pageWindow.addEventListener('pagehide', () => {
    pageWindow.clearInterval(timer)
    pageWindow.clearInterval(backgroundTimer)
    if (updateTimer !== null) pageWindow.clearTimeout(updateTimer)
    if (pageWindow.console.log === log) pageWindow.console.log = originalLog
    const buf = pageWindow.app && pageWindow.app.buf
    if (attached && buf && typeof buf.off === 'function') {
      buf.off('viewUpdate', scheduleUpdate)
      buf.off('cursor-move', scheduleUpdate)
    }
  }, { once: true })
}

export function flushPendingTerminalUpdate (buf) {
  if (!buf.inSyncUpdate && (buf.changed || buf.posChanged) && typeof buf.notify === 'function') {
    buf.notify()
  }
}

export function pasteTerminalText (currentDocument, str) {
  const input = currentDocument.querySelector('#t')
  // New terminals listen on document; legacy terminals listen on the input.
  const event = new currentDocument.defaultView.CustomEvent('paste', { bubbles: true, cancelable: true })
  event.clipboardData = { getData: () => str }
  input.dispatchEvent(event)
}
