const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const stateSource = fs.readFileSync('src/ptt/PttController/PttState.js', 'utf8')
  .replace(/export /g, '')
const frameSource = fs.readFileSync('src/ptt/PttController/PttFrame.js', 'utf8')
  .replace(/^import .*$/gm, '').replace('export function', 'function')
const source = fs.readFileSync('src/ptt/Tasks/Handlers/CheckIsInBoard.js', 'utf8')
  .replace(/^import .*$/m, '')
  .replace('export default function', 'function')
const sandbox = { reportMode: false, showAllLog: false }
vm.runInNewContext(stateSource + '\n' + frameSource + '\n' + source, sandbox)
const { FrameState } = vm.runInNewContext('({ FrameState })', sandbox)

// Old and new (看板設定與管理) board info screens of the LoL board.
const oldInfo = ['《LoL》看板設定', '中文敘述: [LoL] 10/24(六)', '請按任意鍵繼續']
const newInfo = [
  '',
  ' 看板設定與管理  [唯讀檢視]',
  '看板名稱: LoL 板主名單: samhou6/cornsoup/rainnawind',
  '>  1.      中文敘述                    [LoL] 10/24(六)',
  ' 看板資訊  (PgUp)上頁 (PgDn)下頁 (1)跳號'
]

function createContext (rows, board) {
  const sent = []
  const context = {
    state: { frame: FrameState.unknown },
    postData: { board, isCurrectboard: false },
    msg: { PostMessage () {} },
    match: (pattern, flags) => {
      const reg = pattern instanceof RegExp ? pattern : new RegExp(pattern, flags)
      return rows.map(row => reg.exec(row)).find(Boolean)
    },
    insertText: text => sent.push(text)
  }
  context.frame = sandbox.PttFrame.call(context)
  return { context, sent }
}

for (const rows of [oldInfo, newInfo]) {
  for (const board of ['LoL', 'lol']) {
    const { context, sent } = createContext(rows, board)
    assert.strictEqual(context.frame.update(), true)
    assert.strictEqual(context.state.frame, FrameState.boardInfo, 'Recognize the board info screen')
    const result = sandbox.CheckIsInBoard.call(context)
    assert.strictEqual(result.pass, false)
    assert.strictEqual(context.postData.isCurrectboard, true, 'Confirm the board from its info screen')
    result.callback.call(context)
    assert.deepStrictEqual(sent, ['q'], 'Leave the board info screen')
  }
}

// A board whose name only starts with the searched board is a different board.
const { context } = createContext(newInfo.map(row => row.replace('LoL ', 'LoLTW ')), 'LoL')
context.frame.update()
sandbox.CheckIsInBoard.call(context)
assert.strictEqual(context.postData.isCurrectboard, false)
console.log('board info recognition tests passed')
