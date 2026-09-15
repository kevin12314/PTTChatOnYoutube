const fs = require('fs')
const assert = require('assert')
const vm = require('vm')
const source = fs.readFileSync('src/ptt/Tasks/Handlers/SetNewComment.js', 'utf8')
  .replace(/^import .*$/m, '')
  .replace('export default function', 'function')
const sandbox = { FrameState: { firstPageofPost: 3, otherPageofPost: 4 }, showAllLog: false }
vm.runInNewContext(source, sandbox)

for (const frame of [3, 4]) {
  for (const prompt of ['◆ 抱歉, 禁止推薦', '◆ 抱歉，禁止推薦', '◆ 對不起，您的文章或推文間隔太近囉！']) {
    const alerts = []
    const inputs = []
    const context = {
      state: { frame },
      postData: { TrySetNewComment: 0, commentText: '尚未送出的文字' },
      recieveData: { commentedText: '' },
      match: regex => regex.exec(prompt),
      msg: { PostMessage: (name, payload) => alerts.push({ name, ...payload }) },
      insertText: text => inputs.push(text)
    }
    assert.strictEqual(sandbox.SetNewComment.call(context).pass, false)
    assert.strictEqual(alerts.length, 1)
    assert.strictEqual(alerts[0].type, 0)
    assert.ok(alerts[0].msg.includes(prompt.includes('禁止推薦') ? '禁止推薦' : '暫時禁止'))
    assert.deepStrictEqual(inputs, ['\nrG'])
    assert.strictEqual(context.postData.commentText, '尚未送出的文字')
    assert.strictEqual(context.recieveData.commentedText, '')
    // After dismissing the prompt, finish without sending the comment again.
    context.match = regex => regex.exec('瀏覽 第 2 頁 (100%)')
    assert.strictEqual(sandbox.SetNewComment.call(context).pass, true)
    assert.strictEqual(inputs.length, 1)
  }
}
console.log('comment rejection tests passed')
