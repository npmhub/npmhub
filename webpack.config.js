'use strict';
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  devtool: 'sourcemap',
  entry: {
    content: './src/content',
    background: './src/background'
  },
  resolve: {
    alias: {
      // Required until https://github.com/npm/hosted-git-info/pull/26 is in
      url: path.resolve('./src/lib/reduced-url.js')
    }
  },
  externals: {
    // Required until https://github.com/npm/hosted-git-info/pull/25 is in
    util: 'window'
  },
  output: {
    path: path.join(__dirname, 'extension'),
    filename: '[name].js'
  },

  optimization: {
    // Without this, function names will be garbled and enableFeature won't work
    concatenateModules: true,

    // Automatically enabled on prod; keeps it somewhat readable for AMO reviewers
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          mangle: false,
          compress: false,
          output: {
            beautify: true,
            indent_level: 2 // eslint-disable-line camelcase
          }
        }
      })
    ]
  }
};
