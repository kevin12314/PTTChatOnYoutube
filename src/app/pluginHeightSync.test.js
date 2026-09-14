const fs = require('fs')
const assert = require('assert')
const vm = require('vm')

const source = fs.readFileSync('src/app/pluginHeightSync.js', 'utf8')
const script = source
  .replace(/export function /g, 'function ') +
  '\nmodule.exports = { shouldSyncPluginHeightFromContainer, getInitialPluginHeight }'
const sandbox = { module: { exports: {} } }

vm.runInNewContext(script, sandbox)

const { shouldSyncPluginHeightFromContainer, getInitialPluginHeight } = sandbox.module.exports

assert.strictEqual(getInitialPluginHeight({ customPluginSetting: true, sitePluginHeight: 720, globalPluginHeight: 400 }), 720)
assert.strictEqual(getInitialPluginHeight({ customPluginSetting: true, sitePluginHeight: -1, globalPluginHeight: 400 }), -1)
assert.strictEqual(getInitialPluginHeight({ customPluginSetting: true, sitePluginHeight: 0, globalPluginHeight: 400 }), -1)
assert.strictEqual(getInitialPluginHeight({ customPluginSetting: false, sitePluginHeight: 720, globalPluginHeight: 400 }), 400)

assert.strictEqual(shouldSyncPluginHeightFromContainer({
  siteName: 'Youtube',
  currentPluginHeight: -1,
  nextContainerHeight: 640
}), true)

assert.strictEqual(shouldSyncPluginHeightFromContainer({
  siteName: 'Youtube',
  currentPluginHeight: 500,
  nextContainerHeight: 640
}), false)

assert.strictEqual(shouldSyncPluginHeightFromContainer({
  siteName: 'Youtube',
  currentPluginHeight: -1,
  nextContainerHeight: 0
}), false)

assert.strictEqual(shouldSyncPluginHeightFromContainer({
  siteName: 'Holodex',
  currentPluginHeight: -1,
  nextContainerHeight: 640
}), false)

console.log('pluginHeightSync checks passed')
