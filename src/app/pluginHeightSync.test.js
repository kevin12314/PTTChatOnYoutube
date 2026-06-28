const fs = require('fs')
const assert = require('assert')
const vm = require('vm')

const source = fs.readFileSync('src/app/pluginHeightSync.js', 'utf8')
const script = source
  .replace('export function shouldSyncPluginHeightFromContainer', 'function shouldSyncPluginHeightFromContainer') +
  '\nmodule.exports = { shouldSyncPluginHeightFromContainer }'
const sandbox = { module: { exports: {} } }

vm.runInNewContext(script, sandbox)

const { shouldSyncPluginHeightFromContainer } = sandbox.module.exports

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
