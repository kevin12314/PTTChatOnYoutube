const fs = require('fs')
const assert = require('assert')
const vm = require('vm')
const Vue = require('vue')
const { parse, compileTemplate } = require('@vue/compiler-sfc')
const { descriptor } = parse(fs.readFileSync('src/app/chat/ChatSetNewComment.vue', 'utf8'))
const sandbox = { Vuex: { mapGetters: () => ({}) }, gaPush: () => {}, module: { exports: {} } }
vm.runInNewContext(descriptor.script.content.replace(/^import .*$/m, '').replace('export default', 'module.exports ='), sandbox)
const component = sandbox.module.exports
const sent = []
const ctx = {
  ...component.data(),
  ...component.methods,
  className: '',
  placeholder: '',
  getEnableSetNewComment: true,
  setNewComment: '',
  pttState: 1,
  post: { gettedpost: true },
  $store: { dispatch: (...args) => sent.push(args) }
}
for (const name of Object.keys(component.methods)) ctx[name] = ctx[name].bind(ctx)
const { code } = compileTemplate({
  source: descriptor.template.content,
  filename: 'ChatSetNewComment.vue',
  id: 'comment-test',
  compilerOptions: { mode: 'function', prefixIdentifiers: false }
})
// Capture directive bindings without mounting into a browser document.
const render = vm.runInNewContext('(function (Vue) { ' + code + '\n})')({
  ...Vue,
  withDirectives: (vnode, directives) => {
    vnode.dirs = directives.map(([dir, value, arg, modifiers = {}]) => ({ dir, value, arg, modifiers }))
    return vnode
  }
})
const input = render.call(ctx, ctx, []).children[0].children[0].children[0]
// Exercise the actual v-model directive: typing must update before blur.
const listeners = {}
const element = { value: '測試推文', addEventListener: (name, fn) => { listeners[name] = fn } }
const model = input.dirs.find(binding => binding.dir === Vue.vModelText)
assert.ok(model)
model.dir.created(element, model, input)
listeners.input({ target: element })
assert.strictEqual(ctx.commenttext, '測試推文')
let prevented = 0
let stopped = 0
const event = { key: 'Enter', preventDefault: () => { prevented++ }, stopPropagation: () => { stopped++ } }
input.props.onKeydown({ ...event, key: 'a' })
input.props.onKeydown({ ...event, isComposing: true })
input.props.onKeydown({ ...event, keyCode: 229 })
input.props.onKeydown({ ...event, repeat: true })
assert.strictEqual(sent.length, 0)
input.props.onKeydown(event)
assert.deepStrictEqual(sent, [['setNewcomment', '測試推文']])
assert.strictEqual(prevented, 1)
assert.strictEqual(stopped, 1)
ctx.commenttext = ''
input.props.onKeydown(event)
assert.strictEqual(sent[1][0], 'Alert')
console.log('Comment Enter and IME tests passed')
