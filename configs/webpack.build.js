const webpack = require('webpack')

const commonConfig = require('./webpack.common')
const { default: UserscriptPlugin } = require('webpack-userscript')
const meteadata = require('./metadata.build.js')
const { default: merge } = require('webpack-merge')

module.exports = merge(commonConfig, {
  mode: 'production',
  entry: './src/main.js',
  plugins: [
    new UserscriptPlugin({
      metajs: false,
      headers: meteadata
    }),
    new webpack.DefinePlugin({
      reportMode: false,
      showAllLog: false,
      get showPttScreen () { return (false || this.reportMode || this.showAllLog) },
      get showCommand () { return (false || this.reportMode || this.showAllLog) },
      get showMessage () { return (false || this.reportMode || this.showAllLog) },
      get showAlertMsg () { return (false || this.showAllLog) },
      defaultOpen: false,
      disablePttFrame: false,
      simulateIsStreaming: false,
      showScrollLog: false
    })
  ]
})
