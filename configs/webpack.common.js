const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const { VueLoaderPlugin } = require('vue-loader')

const trustedTypesBootstrap = `${fs.readFileSync(path.resolve(__dirname, '../src/initTrustedTypes.js'), 'utf8').trimEnd()}\n;`

module.exports = {
  context: path.resolve(__dirname, '../'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'main.js'
  },
  optimization: {
    minimize: false
  },
  // externals: {
  //   vue: 'Vue'
  // },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.runtime.esm-bundler.js',
      menuCommand: path.resolve(__dirname, '../src/menuCommand/'),
      src: path.resolve(__dirname, '../src/'),
      PttController: path.resolve(__dirname, '../src/ptt/PttController/')
    },
    extensions: ['.js', '.vue', '.css']
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            hoistStatic: false
          }
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
          // {
          //   loader: 'css-loader',
          //   options: { importLoaders: 1 }
          // },
          // 'postcss-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: ['vue-style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: () => trustedTypesBootstrap,
      raw: true,
      entryOnly: true
    }),
    new VueLoaderPlugin(),
    new webpack.ProvidePlugin({
      Vuex: 'vuex',
      $: 'jquery',
      jQuery: 'jquery',
      CryptoJS: 'crypto-js',
      filterXSS: ['xss', 'filterXSS']
    }),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    })
  ]
}
