const fs = require('fs')
const vm = require('vm')
const assert = require('assert')

const load = path => fs.readFileSync(path, 'utf8')
  .replace(/^import .*$/gm, '').replace(/export default function/g, 'function').replace(/export function/g, 'function')
const timers = []
const sandbox = {
  reportMode: false,
  showAllLog: false,
  document: { addEventListener () {} },
  window: { setTimeout: fn => timers.push(fn), clearTimeout () {} },
  clearInterval () {},
  PttState: () => ({ lock: false }),
  PttMatch () {},
  PttTaskManager: () => ({ reset () {} }),
  PttAutoCommand: () => ({}),
  PttFrame: () => ({}),
  PttCommand: () => ({}),
  PttRandomInsert () {},
  PostData: {},
  RecieveData: function () {},
  Login () {},
  GetCommentByAID () {},
  GetCommentByAnySearch () {},
  SetComment () {}
}
vm.runInNewContext(load('src/ptt/PttController/Ptt.js') + '\n' + load('src/ptt/eventBind.js'), sandbox)
const ptt = new sandbox.Ptt({ PostMessage () {} })
const started = []
ptt.addTask = (event, data) => started.push({ event, data })
sandbox.eventBind.call(ptt)
const search = key => ({ board: 'C_Chat', key, recent: 200 })
const drain = () => { while (timers.length) timers.shift()() }

ptt.msg.getCommentByAnySearch({ ...search('/A'), background: true })
assert.strictEqual(started.length, 1)
assert.strictEqual(ptt.state.lock, true)
// One click while refreshing A is enough to start B after A finishes.
ptt.msg.getCommentByAnySearch(search('/B'))
assert.strictEqual(started.length, 1)
ptt.unlock()
assert.strictEqual(started.length, 1, 'Do not replace the response data on the old completion stack')
// A scheduled poll for the old article cannot overtake the pending search.
ptt.msg.getCommentByAnySearch({ ...search('/A'), background: true })
drain()
assert.strictEqual(started.length, 2)
assert.strictEqual(started[1].data.key, '/B')

ptt.msg.getCommentByAnySearch(search('/C'))
ptt.msg.getCommentByAID(search('#1abc_-23'))
ptt.msg.getCommentByAnySearch({ ...search('/B'), background: true })
ptt.unlock()
ptt.unlock()
drain()
assert.strictEqual(started.length, 3, 'Repeated idle notifications must not duplicate a search')
assert.strictEqual(started[2].event, sandbox.GetCommentByAID)
assert.strictEqual(started[2].data.key, '#1abc_-23')

// Busy login and comment events keep their existing behavior and are not queued.
ptt.msg.login({})
ptt.msg.setNewcomment('test')
assert.strictEqual(ptt.pendingSearch, null)
assert.strictEqual(started.length, 3)

ptt.msg.getCommentByAnySearch(search('/D'))
ptt.unlock()
ptt.lock()
drain()
assert.strictEqual(started.length, 3, 'Wait if another operation acquired the lock')
ptt.unlock()
drain()
assert.strictEqual(started[3].data.key, '/D')

ptt.msg.getCommentByAnySearch(search('/E'))
ptt.unlock()
ptt.removeAllTasks()
drain()
assert.strictEqual(started.length, 4, 'Cancellation must also clear the queued search')

// A newer immediate user search supersedes one awaiting its timer.
ptt.lock()
ptt.msg.getCommentByAnySearch(search('/F'))
ptt.unlock()
ptt.msg.getCommentByAnySearch(search('/G'))
drain()
assert.strictEqual(started.length, 5)
assert.strictEqual(started[4].data.key, '/G')
assert.strictEqual(ptt.pendingSearch, null)
console.log('busy search queue and Ptt unlock integration tests passed')
