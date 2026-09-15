const fs = require('fs')
const assert = require('assert')
const vm = require('vm')
const source = fs.readFileSync('src/ptt/terminalAdapter.js', 'utf8').replace(/export function /g, 'function ')
const sandbox = { module: { exports: {} } }
vm.runInNewContext(source + '\nmodule.exports = { readTerminalRows, bindTerminalUpdates, flushPendingTerminalUpdate, pasteTerminalText }', sandbox)
const { readTerminalRows, bindTerminalUpdates, flushPendingTerminalUpdate, pasteTerminalText } = sandbox.module.exports
const rows = ['請輸入代號，或以 guest 參觀，或以 new 註冊', '中文測試']
const doc = { querySelectorAll: () => rows.map(textContent => ({ textContent })) }
assert.deepStrictEqual(Array.from(readTerminalRows({}, doc)), rows)
assert.deepStrictEqual(Array.from(readTerminalRows({
  app: {
    buf: {
      rows: 2, cols: 80, getRowText: row => rows[row]
    }
  }
}, { querySelectorAll: () => { throw Error('Canvas must use buffer') } })), rows)

let poll; let cleanup; let pendingUpdate; let updates = 0; let hidden = 0; let disabled = 0; let cleared = 0
const handlers = {}
const originalLog = () => {}
const page = {
  console: { log: originalLog },
  setInterval: fn => { poll = fn; return 1 },
  clearInterval: () => { cleared++ },
  setTimeout: fn => { pendingUpdate = fn; return 2 },
  clearTimeout: () => { pendingUpdate = null },
  addEventListener: (event, fn) => { cleanup = fn }
}
bindTerminalUpdates(page, () => { updates++ })
page.console.log('unrelated')
assert.strictEqual(updates, 0)
page.console.log('view update')
assert.strictEqual(updates, 1)
page.app = {
  getPlugin: id => {
    if (id === 'login_assist') return undefined
    assert.strictEqual(id, 'auto_login')
    return {
      hide: () => { hidden++ },
      setEnabled: (enabled, persist) => {
        assert.strictEqual(enabled, false)
        assert.strictEqual(persist, false)
        disabled++
      }
    }
  },
  buf: {
    on: (event, fn) => { handlers[event] = fn },
    off: (event, fn) => { assert.strictEqual(fn, handlers[event]); delete handlers[event] }
  }
}
poll()
assert.strictEqual(hidden, 1)
assert.strictEqual(disabled, 1)
assert.strictEqual(cleared, 1)
assert.strictEqual(updates, 2)
page.console.log('view update')
assert.strictEqual(updates, 2)
// Moving the main-menu cursor must advance a waiting search task.
handlers['cursor-move']()
pendingUpdate()
assert.strictEqual(updates, 3)
// Text and cursor updates in one buffer flush must not advance it twice.
handlers.viewUpdate()
const scheduled = pendingUpdate
handlers['cursor-move']()
assert.strictEqual(pendingUpdate, scheduled)
pendingUpdate()
assert.strictEqual(updates, 4)
handlers['cursor-move']()
cleanup()
assert.strictEqual(pendingUpdate, null)
assert.strictEqual(Object.keys(handlers).length, 0)
assert.strictEqual(page.console.log, originalLog)
console.log('terminal adapter tests passed')

// Simulate a hidden iframe: no animation frame callback ever runs.
let notifications = 0
const hiddenBuffer = {
  changed: true,
  posChanged: false,
  inSyncUpdate: true,
  notify () { notifications++; this.changed = false; this.posChanged = false }
}
flushPendingTerminalUpdate(hiddenBuffer)
assert.strictEqual(notifications, 0, 'Do not consume an incomplete synchronized frame')
hiddenBuffer.inSyncUpdate = false
flushPendingTerminalUpdate(hiddenBuffer)
assert.strictEqual(notifications, 1, 'Deliver pending text without requestAnimationFrame')
flushPendingTerminalUpdate(hiddenBuffer)
assert.strictEqual(notifications, 1, 'An idle terminal must not advance commands')
hiddenBuffer.posChanged = true
flushPendingTerminalUpdate(hiddenBuffer)
assert.strictEqual(notifications, 2, 'Deliver cursor-only updates in hidden iframes')
hiddenBuffer.changed = true
flushPendingTerminalUpdate(hiddenBuffer)
assert.strictEqual(notifications, 3, 'Subsequent polling responses continue to be delivered')

// Current terminals use the renamed plugin, without an auto_login alias.
let assistDisabled = false
page.app.getPlugin = id => {
  assert.strictEqual(id, 'login_assist')
  return { hide () {}, setEnabled (enabled, persist) { assistDisabled = !enabled && !persist } }
}
bindTerminalUpdates(page, () => {})
assert.strictEqual(assistDisabled, true)
cleanup()

// Simulate both legacy input listeners and the current document listener.
let inputPastes = 0
let documentPastes = 0
const pasteDocument = {
  defaultView: { CustomEvent: class {
    constructor (type, options) { this.type = type; Object.assign(this, options) }
  } },
  querySelector: selector => {
    assert.strictEqual(selector, '#t')
    return { dispatchEvent (event) {
      assert.strictEqual(event.type, 'paste')
      assert.strictEqual(event.cancelable, true)
      assert.strictEqual(event.clipboardData.getData('text/plain'), 'test\n')
      inputPastes++
      if (event.bubbles) documentPastes++
    } }
  }
}
pasteTerminalText(pasteDocument, 'test\n')
assert.strictEqual(inputPastes, 1)
assert.strictEqual(documentPastes, 1, 'Paste must reach the document listener')

// Userscript window and page window are different objects. Automated reads
// must use the page's paste pipeline without triggering the DOM focus path.
const pasted = []
const composer = {}
let activeElement = composer
const terminalPage = {
  app: {
    dispatchPaste (text) {
      assert.strictEqual(this, terminalPage.app)
      pasted.push(text)
    }
  }
}
const hostDocument = {
  defaultView: {},
  querySelector () {
    return { dispatchEvent () { activeElement = 'terminal' } }
  }
}
for (const text of ['qr', '72.\n', '%', '中文測試\n']) {
  pasteTerminalText(hostDocument, text, terminalPage)
  assert.strictEqual(activeElement, composer, 'Background commands must not focus the iframe')
}
assert.deepStrictEqual(pasted, ['qr', '72.\n', '%', '中文測試\n'])
// A consumed/cancelled paste must not be retried through the DOM path.
terminalPage.app.dispatchPaste = () => false
pasteTerminalText(hostDocument, 'qr', terminalPage)
assert.strictEqual(activeElement, composer)
