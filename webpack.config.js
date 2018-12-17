'use strict';
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  devtool: 'sourcemap',
  entry: {
    content: './source/content',
    background: './source/background'
  },
  resolve: {
    alias: {
      // Required until https://github.com/npm/hosted-git-info/pull/26 is in
      url: path.resolve('./source/lib/reduced-url.js')
    }
  },
  externals: {
    // Required until https://github.com/npm/hosted-git-info/pull/25 is in
    util: 'window'
  },
  output: {
    path: path.join(__dirname, 'distribution'),
    filename: '[name].js'
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: '**',
        context: 'source',
        ignore: '*.js'
      }
    ])
  ],
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
