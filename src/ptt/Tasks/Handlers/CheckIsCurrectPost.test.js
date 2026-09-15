const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const source = fs.readFileSync('src/ptt/Tasks/Handlers/CheckIsCurrectPost.js', 'utf8')
  .replace(/^import .*$/m, '')
  .replace('export default function', 'function')
const sandbox = { FrameState: { board: 2, main: 1 }, reportMode: false }
vm.runInNewContext(source, sandbox)

for (const [key, expected] of [
  ['#1XJWja3B', '#1XJWja3B\nr'],
  ['#1abc_-23', '#1abc_-23\nr'],
  ['/本日直播單\nZ20', 'NPP/本日直播單\nZ20\nSqr'],
  ['/本日直播單', 'NPP/本日直播單\nSqr']
]) {
  const sent = []
  const context = { state: { frame: 2 }, postData: { key }, insertText: text => sent.push(text) }
  const result = sandbox.CheckIsCurrectPost.call(context)
  assert.strictEqual(result.pass, false)
  result.callback.call(context)
  assert.deepStrictEqual(sent, [expected])
  context.state.frame = 3
  assert.strictEqual(sandbox.CheckIsCurrectPost.call(context).pass, true)
}
console.log('article navigation tests passed')
