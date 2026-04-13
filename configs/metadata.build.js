const md = require('./metadata.js')
const metadata = { ...md }
metadata.version = require('../package.json').version

module.exports = metadata
