const utils = require('./utils')
const vueLoaderConfig = require('./vue-loader.conf')
const config = require('../config')

// 创建eslint规则
const createLintingRule = () => ({
  test: /\.(js|vue)$/,
  loader: 'eslint-loader',
  enforce: 'pre',
  include: [utils.resolve('src'), utils.resolve('test')],
  options: {
    formatter: require('eslint-friendly-formatter'),
    emitWarning: !config.dev.showEslintErrorsInOverlay
  }
})

module.exports = {
  entry: {
    index: utils.resolve('src/components/index.js') //程序入口点
  },
  output: {
    libraryTarget: 'umd'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': utils.resolve('src'),
    }
  },
  externals: {
    vue: "vue",
    axios: "axios"
  },
  module: {
    rules: [
      ...(config.dev.useEslint ? [createLintingRule()] : []),
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [utils.resolve('src'), utils.resolve('test')]
      }, {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      }]
  }
}
