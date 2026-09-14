const fs = require('fs')
const assert = require('assert')
const vm = require('vm')
const sandbox = { module: { exports: {} } }
vm.runInNewContext(fs.readFileSync('src/SupportWebsite/holodex/embeddedDrag.js', 'utf8').replace('export function', 'function') + '\nmodule.exports = bindEmbeddedDrag', sandbox)
const bind = sandbox.module.exports
const item = { i: 'ptt', isResizable: false }
const other = { i: 'video', isDraggable: true }
const store = {
  state: { multiview: { layout: [item, other] } },
  commit (mutation, id) {
    assert.strictEqual(id, 'ptt')
    item.isDraggable = item.isResizable = mutation === 'multiview/unfreezeLayoutItem'
  }
}
const grid = {
  i: 'ptt',
  $store: store,
  $set: (obj, key, value) => { obj[key] = value },
  $delete: (obj, key) => { delete obj[key] }
}
const binding = bind({ __vue__: { $parent: grid } })
binding.setEditing(false)
assert.strictEqual(item.isDraggable, false, 'Selecting text cannot move the grid cell')
assert.strictEqual(item.isResizable, false)
assert.strictEqual(other.isDraggable, true, 'Other cells stay interactive')
binding.setEditing(true)
assert.strictEqual(item.isDraggable, true)
assert.strictEqual(item.isResizable, true)
binding.setEditing(false)
binding.restore()
assert.deepStrictEqual(item, { i: 'ptt', isResizable: false })
store.state.multiview.layout = [other]
binding.setEditing(true)
binding.restore()
assert.strictEqual(bind({}), null)
console.log('Embedded PTT selection and layout dragging tests passed')
