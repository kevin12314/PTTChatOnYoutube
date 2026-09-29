const fs = require('fs')
const vm = require('vm')
const assert = require('assert')

const load = path => fs.readFileSync(path, 'utf8')
  .replace(/^import .*$/gm, '')
  .replace(/export default function/g, 'function')
  .replace(/export function/g, 'function')
let now = 10000
let timerId = 0
const timers = new Map()
const sent = []
const sandbox = {
  Date: { now: () => now },
  reportMode: false,
  showAllLog: false,
  showCommand: false,
  FrameState: { firstPageofPost: 3, otherPageofPost: 4 },
  document: { addEventListener () {} },
  window: {
    document: {},
    setTimeout (fn, delay) { timers.set(++timerId, { fn, at: now + delay }); return timerId },
    clearTimeout (id) { timers.delete(id) }
  },
  clearInterval () {},
  unsafeWindow: {},
  pasteTerminalText: (document, text) => sent.push({ text, at: now }),
  PttState: () => ({ lock: false, frame: 4, isInsertedText: '' }),
  PttMatch () {},
  PttTaskManager: () => ({ reset () {} }),
  PttAutoCommand: () => ({}),
  PttFrame: () => ({}),
  PostData: {},
  RecieveData: function () {}
}
vm.runInNewContext([
  'src/ptt/PttController/Ptt.js',
  'src/ptt/PttController/PttCommand.js',
  'src/ptt/PttController/PttRandomInsert.js',
  'src/ptt/Tasks/Handlers/SetNewComment.js'
].map(load).join('\n'), sandbox)
const ptt = new sandbox.Ptt({ PostMessage () {} })
const advance = ms => {
  now += ms
  for (const [id, timer] of timers) {
    if (timer.at <= now) { timers.delete(id); timer.fn() }
  }
}

ptt.lock()
ptt.insertText('qr', true)
assert.deepStrictEqual(sent, [{ text: 'qr', at: 10000 }])
// Confirmation and its refresh collide with a recent automatic read.
advance(100)
ptt.postData = { TrySetNewComment: 0, commentText: '推文' }
ptt.match = regex => regex.exec('user: 推文  確定[y/N]:')
sandbox.SetNewComment.call(ptt)
assert.strictEqual(sent.length, 1)
let completed = 0
ptt.command.set(() => completed++)
ptt.state.isInsertedText = ''
ptt.command.execute()
ptt.randomInsert()
assert.strictEqual(completed, 0, 'Repaints cannot advance a deferred operation')
assert.strictEqual(sent.length, 1, 'Random fallback must not navigate away during cooldown')
advance(2999)
assert.strictEqual(sent.length, 1)
advance(1)
assert.deepStrictEqual(sent[1], { text: 'y\nr', at: 13100 })
ptt.command.execute()
assert.strictEqual(completed, 1)

// The follow-up fetch and subsequent automatic poll share the same clock.
ptt.insertText('qr', true)
advance(3100)
assert.deepStrictEqual(sent[2], { text: 'qr', at: 16200 })
ptt.unlock()
ptt.lock()
ptt.insertText('qr', true)
advance(3099)
assert.strictEqual(sent.length, 3)
advance(1)
assert.deepStrictEqual(sent[3], { text: 'qr', at: 19300 })

// User text is never classified by the characters it contains.
ptt.insertText('rP 推文\n')
assert.strictEqual(sent[4].text, 'rP 推文\n')
ptt.insertText('qr', true)
ptt.removeAllTasks()
advance(5000)
assert.strictEqual(sent.length, 5, 'Cancellation must not send a stale read later')
assert.strictEqual(ptt.articleReadTimer, null)
ptt.lock()
ptt.insertText('P', true)
assert.strictEqual(sent[5].text, 'P', 'AID reads use the same cooldown and resume after cancellation')
console.log('shared article read cooldown tests passed')
