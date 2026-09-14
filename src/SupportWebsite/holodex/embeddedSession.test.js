const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const source = fs.readFileSync('src/SupportWebsite/holodex/InitHD.js', 'utf8')
const detach = source.slice(source.indexOf('    function destroyEmbeddedApp ('), source.indexOf('    function prepareEmbeddedCellHost'))
const mount = source.slice(source.indexOf('    mountEmbeddedAppToCell = function'), source.indexOf('    function applyClassicSidebarLayout'))
let unmounted = 0
let initialized = 0
const parking = { appendChild (node) { node.parent = this } }
const host = { appendChild (node) { node.parent = this } }
const handle = { mountElement: {}, ids: { rootId: 'ptt' }, chats: ['existing comment'], unmount () { unmounted++ } }
const sandbox = {
  embeddedAppHandle: handle,
  embeddedActiveCell: { 0: { __vue__: { i: 'old-cell' } }, length: 1 },
  embeddedDrag: null,
  parkedCellId: null,
  embeddedFrameSyncTimer: null,
  observer: null,
  layoutObserver: null,
  getOrCreateParkingLot: () => parking,
  getEmbeddedIds: () => null,
  hideEmbeddedPttFrame () {},
  restoreEmbeddedCellHost () { sandbox.embeddedActiveCell = null },
  prepareEmbeddedCellHost: () => [host],
  bindEmbeddedDrag: () => null,
  InitApp () { initialized++; return handle },
  ChangeLog () {},
  applyHolodexPanelTheme () {},
  setTimeout () {},
  watchEmbeddedCell () {}
}
vm.createContext(sandbox)
vm.runInContext(detach + '\n' + mount, sandbox)
vm.runInContext('destroyEmbeddedApp(true)', sandbox)
assert.strictEqual(unmounted, 0)
assert.strictEqual(handle.mountElement.parent, parking)
assert.strictEqual(sandbox.parkedCellId, 'old-cell')
// A replacement split can have a different ID; clicking P must reuse the session.
sandbox.mountEmbeddedAppToCell({ 0: { __vue__: { i: 'new-cell' } }, length: 1 })
assert.strictEqual(initialized, 0)
assert.strictEqual(sandbox.embeddedAppHandle, handle)
assert.strictEqual(handle.mountElement.parent, host)
assert.deepStrictEqual(handle.chats, ['existing comment'])
assert.strictEqual(sandbox.parkedCellId, null)
vm.runInContext('destroyEmbeddedApp()', sandbox)
assert.strictEqual(unmounted, 1, 'Leaving multiview still disposes the session')
assert.strictEqual(sandbox.embeddedAppHandle, null)
console.log('Embedded session survives split and remount tests passed')
