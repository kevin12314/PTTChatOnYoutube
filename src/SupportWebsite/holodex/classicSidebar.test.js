const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const source = fs.readFileSync('src/SupportWebsite/holodex/InitHD.js', 'utf8')
const start = source.indexOf('    function applyClassicSidebarGap (')
const end = source.indexOf('    function syncClassicPanelHeights (', start)
const parent = { style: { width: '100%' } }
const grid = { style: {}, parentNode: parent }
const sandbox = { defaultVideo: [grid] }
vm.runInNewContext(source.slice(start, end), sandbox)
for (let i = 0; i < 3; i++) {
  sandbox.applyClassicSidebarGap(350)
  assert.strictEqual(grid.style.width, 'calc(100% - 350px)')
  assert.strictEqual(grid.style.marginRight, '350px')
  assert.strictEqual(parent.style.width, '100%', 'Toolbar ancestor must remain full width')
  assert.strictEqual(grid.parentNode, parent, 'Do not move player DOM when opening PTT')
  sandbox.applyClassicSidebarGap(0)
  assert.strictEqual(grid.style.width, '')
  assert.strictEqual(grid.style.maxWidth, '')
  assert.strictEqual(grid.style.marginRight, '')
}
assert.ok(!source.includes('applyClassicHeaderFill'), 'Do not cover the toolbar with a filler')
console.log('Classic sidebar layout tests passed')
