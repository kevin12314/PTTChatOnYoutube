const fs = require('fs')
const assert = require('assert')
const vm = require('vm')
const source = fs.readFileSync('src/ptt/frameUrl.js', 'utf8').replace(/export function /g, 'function ')
const sandbox = { URL, module: { exports: {} } }
vm.runInNewContext(source + '\nmodule.exports = { createPttFrameUrl, readPttOwnerOrigin }', sandbox)
const { createPttFrameUrl, readPttOwnerOrigin } = sandbox.module.exports
for (const origin of ['https://www.youtube.com', 'https://holodex.net']) {
  const first = createPttFrameUrl(origin, 1)
  const second = createPttFrameUrl(origin, 2)
  assert.notStrictEqual(first, second)
  assert.strictEqual(new URL(first).origin, 'https://term.ptt.cc')
  assert.strictEqual(readPttOwnerOrigin(first), origin)
  assert.strictEqual(readPttOwnerOrigin(second), origin)
  assert.strictEqual(readPttOwnerOrigin('https://term.ptt.cc/?url=' + origin), origin)
}
assert.throws(() => readPttOwnerOrigin('https://term.ptt.cc/'), /Missing PTT host origin/)
console.log('PTT frame URL tests passed')
