'use strict';
const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    content: './src/content',
    background: './src/background',
    options: './src/options'
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin()
  ],
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
  }
};
