'use strict';
const path = require('path');
const SizePlugin = require('size-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  devtool: 'sourcemap',
  stats: 'errors-only',
  entry: {
    content: './source/content',
    background: './source/background'
  },
  resolve: {
    alias: {
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
    new SizePlugin(),
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

    // Automatically enabled on production; keeps it somewhat readable for AMO reviewers
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
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
