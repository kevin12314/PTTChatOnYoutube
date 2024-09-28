const webpack = require('webpack')
const path = require('path')
const commonConfig = require('./webpack.common')
const { default: UserscriptPlugin } = require('webpack-userscript')
const meteadata = require('./metadata.dev.js')
const { default: merge } = require('webpack-merge')

module.exports = merge(commonConfig, {
  mode: 'development',
  entry: './src/main.js',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, '../'),
      watch: {
        ignored: /node_modules/, // otherwise it takes a lot of time to refresh
        usePolling: true // or use an integer for a check every x milliseconds, e.g. poll: 1000,
      }

    },
    // contentBase: path.resolve(__dirname, '../'),
    server: 'https',
    hot: true,
    allowedHosts: 'all',
    open: ['dist/main.user.js']
    // watchOptions: {
    //   poll: true, // or use an integer for a check every x milliseconds, e.g. poll: 1000,
    //   ignored: /node_modules/ // otherwise it takes a lot of time to refresh
    // }
  },
  plugins: [
    new UserscriptPlugin({
      metajs: false,
      // headers: './configs/metadata.dev.js'
      headers: meteadata
    }),
    new webpack.DefinePlugin({
      reportMode: true,
      showAllLog: false,
      get showPttScreen () { return (false || this.reportMode || this.showAllLog) },
      get showCommand () { return (false || this.reportMode || this.showAllLog) },
      get showMessage () { return (true || this.reportMode || this.showAllLog) },
      get showAlertMsg () { return (false || this.showAllLog) },
      defaultOpen: false,
      disablePttFrame: false,
      simulateIsStreaming: false,
      showScrollLog: false
    })
  ]
})
