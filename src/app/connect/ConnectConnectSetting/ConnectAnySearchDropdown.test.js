const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const component = fs.readFileSync('src/app/connect/ConnectConnectSetting/ConnectAnySearchDropdown.vue', 'utf8')
  .split('<script>')[1].split('</script>')[0]
  .replace(/^import .*$/gm, '')
  .replace('export default', 'module.exports =')
const analytics = fs.readFileSync('src/ga/setvalue.js', 'utf8')
  .replace('export default function', 'function gaPush')

for (const page of [{}, { pttDataLayer: [] }, { pttDataLayer: { push () { throw Error('blocked') } } }]) {
  const sent = []
  const sandbox = {
    module: { exports: {} },
    unsafeWindow: page,
    Vuex: { mapGetters: () => ({}) },
    showAllLog: false,
    reportMode: false
  }
  vm.runInNewContext(analytics + '\n' + component, sandbox)
  const context = {
    ...sandbox.module.exports.methods,
    pttState: 1,
    post: {},
    isStream: true,
    msg: { PostMessage: (name, data) => { sent.push({ name, data }); return true } },
    $store: { dispatch: () => {} }
  }
  for (const item of ['C_Chat,/本日直播單,Z20', 'C_Chat,/本日直播單', 'vtuber,/彩虹直播']) {
    assert.strictEqual(context.$_connectAnySearchDropdown_onClickDropdownItem(item), true)
    const message = sent.pop()
    assert.strictEqual(message.name, 'getCommentByAnySearch')
    assert.strictEqual(message.data.board, item.split(',')[0])
    assert.strictEqual(message.data.key, item.slice(item.indexOf(',') + 1))
    assert.strictEqual(message.data.recent, 200)
  }
}
console.log('Recent search sends commands even when analytics is unavailable or blocked')
