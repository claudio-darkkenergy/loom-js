const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');
const isProd = process.env.NODE_ENV === 'production';
console.log(`building... ${isProd ? 'production' : 'development'}`);

module.exports = {
    entry: {
        index: 'src/index.ts'
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    },
    // Fixes npm packages that depend on `fs` module
    node: {
        fs: 'empty'
    },
    output: {
        filename: '[name].js',
        libraryTarget: 'commonjs',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new CleanWebpackPlugin()
    ],
    resolve: {
        alias: {
            '@framework': 'src/index',
            '@framework/': 'src/'
        },
        extensions: ['.css', '.js', '.scss', '.ts'],
        modules: ['node_modules', path.resolve(__dirname)]
    },
    target: 'web'
};
