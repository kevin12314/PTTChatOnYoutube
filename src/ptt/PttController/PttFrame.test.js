const fs = require('fs')
const vm = require('vm')
const assert = require('assert')

const frameSource = fs.readFileSync('src/ptt/PttController/PttFrame.js', 'utf8')
  .replace(/^import .*$/gm, '').replace('export function', 'function')
const initSource = fs.readFileSync('src/ptt/pttindex.js', 'utf8')
  .replace(/^import .*$/gm, '').replace('export function', 'function')
const stateSource = fs.readFileSync('src/ptt/PttController/PttState.js', 'utf8')
  .replace(/export /g, '')
let update
let executed = 0
let skip = false
let screen = '[←]離開 [→]閱讀'
const ptt = {
  articleReadTimer: null,
  state: { frame: 2 },
  msg: { PostMessage () {} },
  match: pattern => screen.split('\n').map(row => pattern.exec(row)).find(Boolean),
  clearScreen () {},
  autoCommand: { runAutoCommand: () => skip },
  command: { execute: () => { executed++ } }
}
const sandbox = {
  reportMode: false,
  showAllLog: false,
  unsafeWindow: {},
  window: { location: { href: 'test' } },
  eventBind () {},
  Ptt: function () { return ptt },
  bindTerminalUpdates: (page, callback) => { update = callback }
}
vm.runInNewContext(stateSource + '\n' + frameSource + '\n' + initSource, sandbox)
ptt.frame = sandbox.PttFrame.call(ptt)
sandbox.InitPTT(ptt.msg)
update()
assert.strictEqual(ptt.state.frame, 2)
assert.strictEqual(executed, 1)

// Unknown screens must neither retain the board state nor send article keys.
for (const text of ['', '畫面更新中', '養雞']) {
  screen = text
  update()
  assert.strictEqual(ptt.state.frame, -1)
  assert.strictEqual(executed, 1)
}
screen = '[←]離開 [→]閱讀'
update()
assert.strictEqual(ptt.state.frame, 2)
assert.strictEqual(executed, 2, 'Resume the pending command on a recognized screen')

// The board in the reported screenshot starts with Read, without Leave.
// Exercise recognition and dispatch of the actual pending navigation handler.
const mainHandlerSource = fs.readFileSync('src/ptt/Tasks/Handlers/CheckIsInMain.js', 'utf8')
  .replace(/^import .*$/gm, '').replace('export default function', 'function')
vm.runInNewContext(mainHandlerSource, sandbox)
const navigationInputs = []
ptt.insertText = text => navigationInputs.push(text)
const countExecution = ptt.command.execute
ptt.command.execute = () => {
  const result = sandbox.CheckIsInMain.call(ptt)
  if (!result.pass) result.callback.call(ptt)
}
screen = [
  '【板主:daniel0527/arrenwu/motw1999/jerry7..】                  看板《C_Chat》',
  '[→]閱讀 [z]精華區 [Tab]文摘 [s]選擇看板 [b]進板 [i]看板設定 [^X]課表 [/]搜尋',
  '  編號   日 期 作 者          文 章 標 題',
  '文章列表 (A)發表 (Y)回應 (^X)推文 (d)刪除 (→)閱讀 (b)進板 (←)離開 (h)說明'
].join('\n')
ptt.state.frame = 1
update()
assert.strictEqual(ptt.state.frame, 2, 'Recognize the reported board instead of retaining the main state')
assert.deepStrictEqual(navigationInputs, ['q'], 'The pending return-to-main command must resume')
ptt.command.execute = countExecution

// Similar text inside an article or a partial menu must remain unknown.
for (const text of ['推 user: [→]閱讀 [z]精華區 [Tab]文摘', '[→]閱讀', '[→]閱讀 [z]精華區']) {
  screen = text
  update()
  assert.strictEqual(ptt.state.frame, -1)
  assert.strictEqual(executed, 2)
}
screen = '[←]離開 [→]閱讀'

ptt.articleReadTimer = 1
update()
assert.strictEqual(executed, 2, 'Repaints must wait for the scheduled article read')
ptt.articleReadTimer = null

skip = true
update()
assert.strictEqual(executed, 2, 'Auto-command screens must still suppress normal commands')
console.log('frame recognition and command gating tests passed')

// Exercise actual frame recognition -> command dispatch -> posting handler.
// The terminal removes its normal article footer while asking for a comment.
const commentSource = fs.readFileSync('src/ptt/Tasks/Handlers/SetNewComment.js', 'utf8')
  .replace(/^import .*$/gm, '').replace('export default function', 'function')
vm.runInNewContext(commentSource, sandbox)
const inputs = []
ptt.insertText = text => inputs.push(text)
ptt.recieveData = {}
ptt.command.execute = () => sandbox.SetNewComment.call(ptt)
ptt.state.lock = true
skip = false
for (const articlePage of ['01', '02']) {
  inputs.length = 0
  ptt.postData = { commentText: '測試推文', TrySetNewComment: 0 }
  screen = '目前顯示: 第 ' + articlePage + ' 頁 瀏覽 第 2 頁 (100%)'
  update()
  screen = '您覺得這篇文章 1.值得推薦 2.給它噓聲 3.只加註解 [1]'
  update()
  assert.deepStrictEqual(inputs, ['%', '\n測試推文\n'])
  screen = 'testuser: 測試推文   確定[y/N]:'
  update()
  assert.deepStrictEqual(inputs, ['%', '\n測試推文\n', 'y\nr'])
  assert.strictEqual(ptt.recieveData.commentedText, '測試推文')
}

for (const prompt of ['作者本人, 使用註解', '時間太近, 使用註解', '◆ 抱歉，禁止推薦', '◆ 本文已過長, 禁止快速連續推文']) {
  ptt.state.frame = 4
  ptt.postData = { commentText: '測試推文', TrySetNewComment: 0 }
  inputs.length = 0
  screen = prompt
  update()
  assert.strictEqual(inputs.length, 1, 'Posting dialogs must reach the posting handler')
}
ptt.state.frame = 2
screen = '您覺得這篇文章'
inputs.length = 0
update()
assert.strictEqual(ptt.state.frame, -1)
assert.strictEqual(inputs.length, 0, 'A non-article screen cannot authorize posting')
console.log('comment dialog frame dispatch integration tests passed')
