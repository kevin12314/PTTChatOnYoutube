const fs = require('fs')
const vm = require('vm')
const assert = require('assert')

const source = fs.readFileSync('src/ptt/PttController/PttAutoCommand.js', 'utf8')
  .replace(/export /g, '')
const sandbox = { showCommand: false }
vm.runInNewContext(source, sandbox)

let screen = ''
const inputs = []
const ptt = {
  state: {},
  msg: { PostMessage () {} },
  match: pattern => screen.split('\n').map(row => pattern.exec(row)).find(Boolean),
  insertText: text => inputs.push(text)
}
ptt.autoCommand = sandbox.PttAutoCommand.call(ptt)

// Reported screen: logging in with unread mail ends up in the mail menu.
screen = [
  '【私人信件區】                    你有新信件',
  '                > (R)ead          我的信箱',
  '                  (S)end          站內寄信',
  '電子郵件 [ 天秤時 ] 10/19 週一 13:43 | testuser   (←)回到上層'
].join('\n')
assert.strictEqual(ptt.autoCommand.runAutoCommand(), true)
assert.deepStrictEqual(inputs, ['e'], 'Leave the private mail menu back to the main menu')

inputs.length = 0
screen = '【電子郵件】'
assert.strictEqual(ptt.autoCommand.runAutoCommand(), true)
assert.deepStrictEqual(inputs, ['e'], 'Keep supporting the old mail menu title')

inputs.length = 0
screen = '【 精華公佈欄 】'
assert.strictEqual(ptt.autoCommand.runAutoCommand(), false)
assert.deepStrictEqual(inputs, [], 'The main menu needs no auto command')
console.log('auto command mail menu tests passed')
