const md = require('./metadata.js')
const metadata = { ...md }
metadata.version = require('../package.json').version
metadata.updateURL = 'http://127.0.0.1:8080/main.user.js'

module.exports = metadata
