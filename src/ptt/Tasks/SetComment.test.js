const fs = require('fs')
const vm = require('vm')
const assert = require('assert')

const load = path => fs.readFileSync('src/ptt/' + path + '.js', 'utf8')
  .replace(/^import .*$/gm, '')
  .replace(/export default function/g, 'function')
  .replace(/export /g, '')
const sandbox = {
  reportMode: false,
  showAllLog: false,
  showCommand: false,
  parsePttPostTime: () => new Date(),
  GetCommentByAnySearch: function () {}
}
vm.runInNewContext([
  'PttController/PttState', 'PttController/PttFrame',
  'PttController/PttCommand', 'Tasks/HandlerRunner',
  'Tasks/Handlers/CheckIsLogined', 'Tasks/Handlers/CheckIsInBoard',
  'Tasks/Handlers/CheckIsCurrectPost', 'Tasks/Handlers/CheckIsInsideTitleInPost',
  'Tasks/Handlers/SetNewComment', 'MessagePosterData/RecieveData', 'Tasks/SetComment'
].map(load).join('\n'), sandbox)

for (const scenario of [
  { page: '01', prompt: '您覺得這篇文章 1.值得推薦 2.給它噓聲 3.只加註解 [1]', text: '\n測試推文\n' },
  { page: '02', prompt: '作者本人, 使用註解', text: '測試推文\n' },
  { page: '01', prompt: '時間太近, 使用註解', text: '測試推文\n' },
  { page: '02', prompt: '◆ 抱歉，禁止推薦', text: '\nrG', rejected: true }
]) {
  const { page, prompt, text, rejected } = scenario
  const inputs = []
  const queue = []
  const messages = []
  let fetched = false
  const ptt = {
    articleReadTimer: null,
    state: { lock: true, frame: Number(page) + 2, screen: [] },
    postData: {
      board: 'Test', key: '#12345678', isSamePost: true,
      insideTitle: '原討論串', TrySetNewComment: 100, isCurrectboard: true
    },
    msg: { PostMessage: (name, data) => messages.push({ name, data }) },
    match (regex) { return new RegExp(regex).exec(this.state.screen.join('\n')) },
    insertText: text => inputs.push(text),
    addTask (fn, ...args) { queue.push({ fn, args }) },
    endTask () {
      const task = queue.shift()
      if (!task) { this.state.lock = false; return }
      if (task.fn === sandbox.GetCommentByAnySearch) { fetched = true; return }
      task.fn.apply(this, task.args)
    }
  }
  ptt.command = sandbox.PttCommand.call(ptt)
  ptt.frame = sandbox.PttFrame.call(ptt)
  const update = text => {
    ptt.state.screen = text.split('\n')
    if (ptt.frame.update()) ptt.command.execute()
  }
  ptt.state.screen = [' 標題 原討論串', '目前顯示: 第 ' + page + ' 頁 瀏覽 第 2 頁 (100%)']
  sandbox.SetComment.call(ptt, '測試推文')
  assert.deepStrictEqual(inputs, ['%'])
  // Posting redraws can hide the original title and article footer.
  update(prompt)
  assert.deepStrictEqual(inputs, ['%', text], 'Posting must not rerun navigation on a dialog')
  if (!rejected) {
    update('testuser: 測試推文   確定[y/N]:')
    assert.deepStrictEqual(inputs, ['%', text, 'y\nr'])
  }
  update(' 標題 原討論串\n目前顯示: 第 ' + page + ' 頁 瀏覽 第 2 頁 (100%)')
  assert.strictEqual(fetched, true, 'Resume fetching only after posting completes')
  assert.strictEqual(messages.find(message => message.name === 'commentedText').data.commentedText, rejected ? '' : '測試推文')
  assert.ok(!inputs.includes('qq'), 'No posting dialog may send article-exit keys')
}
console.log('posting navigation isolation tests passed')
