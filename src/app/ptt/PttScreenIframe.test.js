const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const { parse } = require('@vue/compiler-sfc')
const { descriptor } = parse(fs.readFileSync('src/app/ptt/PttScreenIframe.vue', 'utf8'))
let poll
let cleared = 0
const sharedWindow = {}
const sandbox = {
  module: { exports: {} },
  createPttFrameUrl: () => 'https://term.ptt.cc/',
  document: { getElementById: () => ({ contentWindow: sharedWindow }) },
  window: { addEventListener () {}, removeEventListener () {} },
  setInterval: fn => { poll = fn; return 1 },
  clearInterval: () => { cleared++ }
}
vm.runInNewContext(descriptor.script.content.replace(/^import .*$/m, '').replace('export default', 'module.exports ='), sandbox)
const component = sandbox.module.exports
function mount (msg) {
  const ctx = {
    msg,
    $el: { contentWindow: {} },
    $nextTick (fn) { fn.call(this) },
    debugPttFrame () {},
    removeiframe () {}
  }
  Object.assign(ctx, component.data.call(ctx))
  component.mounted.call(ctx)
  return ctx
}
// Embedded mode creates its panel after the shared terminal has announced ready.
const msg = { ownerorigin: 'https://holodex.net', pttReady: true }
const embedded = mount(msg)
assert.strictEqual(embedded.removePttFrame, true, 'Never render a duplicate shared iframe')
assert.strictEqual(msg.pttReady, true, 'Mounting a panel must preserve shared readiness')
poll()
assert.strictEqual(msg.targetWindow, sharedWindow)
assert.strictEqual(embedded.targetWindowTimer, null)
component.beforeUnmount.call(embedded)
const remounted = mount(msg)
assert.strictEqual(msg.pttReady, true, 'Moving to another grid cell must preserve readiness')
component.beforeUnmount.call(remounted)
assert.strictEqual(cleared, 3, 'Unmount clears a pending frame lookup')
// Classic mode mounts its panel before the shared frame has loaded.
const pendingMsg = { ownerorigin: 'https://holodex.net', pttReady: false }
const pending = mount(pendingMsg)
assert.strictEqual(pendingMsg.pttReady, false)
component.beforeUnmount.call(pending)
// YouTube owns a new iframe, so an old ready flag must be reset.
const youtubeMsg = { ownerorigin: 'https://www.youtube.com', pttReady: true }
const youtube = mount(youtubeMsg)
assert.strictEqual(youtube.removePttFrame, false)
assert.strictEqual(youtubeMsg.pttReady, false)
assert.strictEqual(youtubeMsg.targetWindow, youtube.$el.contentWindow)
console.log('Shared PTT iframe readiness tests passed')
