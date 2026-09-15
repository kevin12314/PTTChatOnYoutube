const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const sandbox = { showAllLog: false, showCommand: false, Ptt: {} }
const loginSource = fs.readFileSync('src/ptt/Tasks/Login.js', 'utf8')
  .replace(/^import .*$/m, '').replace('export function', 'function')
const autoSource = fs.readFileSync('src/ptt/PttController/PttAutoCommand.js', 'utf8')
  .replace(/export /g, '')
vm.runInNewContext(loginSource + '\n' + autoSource, sandbox)

for (const deleteOthers of [true, false]) {
  const sent = []
  const alerts = []
  let pending
  let screen = ''
  const context = {
    state: { login: false },
    command: { set: (fn, ...args) => { pending = { fn, args } } },
    match: regex => regex.exec(screen),
    insertText: text => { if (text) sent.push(text) },
    msg: { PostMessage: (name, payload) => alerts.push(payload) }
  }
  vm.runInNewContext('TryLogin = 2', sandbox)
  sandbox.login.call(context, 'test-id', 'test-password', deleteOthers)
  for (let i = 0; i < 2; i++) pending.fn.apply(context, pending.args)
  assert.strictEqual(context.state.deleteOtherConnection, deleteOthers)
  screen = '請輸入代號，或以 guest 參觀，或以 new 註冊'
  pending.fn.apply(context, pending.args)
  assert.deepStrictEqual(sent, ['test-id\ntest-password\n'])
  screen = '您想刪除其他重複登入的連線嗎？[Y/n]'
  context.autoCommand = sandbox.PttAutoCommand.call(context)
  assert.strictEqual(context.autoCommand.runAutoCommand(), true)
  assert.strictEqual(sent[1], deleteOthers ? 'y\n' : 'n\n')
  assert.strictEqual(alerts.some(alert => alert.msg.includes('連線上限')), !deleteOthers)
}
console.log('login duplicate connection tests passed')
