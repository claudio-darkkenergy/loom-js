const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common');

module.exports = merge(common, {
    devtool: 'eval-source-map',
    mode: 'development',
    optimization: {
        usedExports: true
    }
});
