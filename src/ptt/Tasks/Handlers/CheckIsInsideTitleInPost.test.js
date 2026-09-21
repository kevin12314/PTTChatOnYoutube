const fs = require('fs')
const vm = require('vm')
const assert = require('assert')

const source = fs.readFileSync('src/ptt/Tasks/Handlers/CheckIsInsideTitleInPost.js', 'utf8')
  .replace(/^import .*$/gm, '')
  .replace('export default function', 'function')
const runner = fs.readFileSync('src/ptt/Tasks/HandlerRunner.js', 'utf8')
  .replace('export function', 'function')
const sandbox = {
  FrameState: { firstPageofPost: 3, otherPageofPost: 4 },
  reportMode: false,
  showAllLog: false,
  parsePttPostTime: () => new Date(0)
}
vm.runInNewContext(source + '\n' + runner, sandbox)

function context (title, samePost = true, normalTitle = true) {
  return {
    state: { frame: 3, screen: [title] },
    postData: { isSamePost: samePost, insideTitle: '指定文章', postTime: new Date(0) },
    recieveData: {},
    match: pattern => normalTitle ? pattern.exec(' 標題 ' + title) : null
  }
}

// A different article must stop the handler chain before comments are read.
for (const normalTitle of [true, false]) {
  const ptt = context('另一篇文章', true, normalTitle)
  const sent = []
  let readComments = false
  let retry
  ptt.insertText = text => sent.push(text)
  ptt.command = { set: (...args) => { retry = args } }
  ptt.endTask = () => { throw Error('Wrong article must not complete the task') }
  sandbox.RunHandler.call(ptt, [sandbox.CheckIsInsideTitleInPost, () => {
    readComments = true
    return { pass: true }
  }])
  assert.strictEqual(readComments, false)
  assert.deepStrictEqual(sent, ['qq'])
  assert.strictEqual(retry[0], sandbox.RunHandler)
  assert.strictEqual(ptt.postData.insideTitle, '指定文章')
  assert.strictEqual(ptt.recieveData.title, undefined)
}

for (const title of ['指定文章', '指定文章   ']) {
  const ptt = context(title)
  assert.strictEqual(sandbox.CheckIsInsideTitleInPost.call(ptt).pass, true)
  assert.strictEqual(ptt.recieveData.title, '指定文章')
}

const fresh = context('新指定文章', false)
assert.strictEqual(sandbox.CheckIsInsideTitleInPost.call(fresh).pass, true)
assert.strictEqual(fresh.postData.insideTitle, '新指定文章')
assert.strictEqual(fresh.recieveData.title, '新指定文章')

const laterPage = context('內文')
laterPage.state.frame = 4
assert.strictEqual(sandbox.CheckIsInsideTitleInPost.call(laterPage).pass, true)
console.log('article identity and handler retry tests passed')
