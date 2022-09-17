/*
 * Debugging Webpack
 * `npm install --global node-nightly`
 * Run this only once.
 * `node-nightly`
 * Access the Webpack bin from the node_modules.
 * `node-nightly --inspect --inspect-brk ./node_modules/webpack/bin/webpack.js`
 * To Upgrade...
 * `node-nightly --upgrade`
 */
import CopyPlugin from 'copy-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as path from 'path';
import PrerenderSsgWebpackPlugin from 'prerender-ssg-webpack-plugin';
import {
    Configuration,
    ProgressPlugin,
    RuleSetRule,
    WebpackOptionsNormalized,
    WebpackPluginInstance
} from 'webpack';

const defaultTemplate = require('./templates/index.js');
const CWD = process.cwd();
const port4001 = 4001;
const port4002 = 4002;

export default (env: {
    [key: string]: string;
}): Configuration & { devServer?: WebpackOptionsNormalized['devServer'] } => {
    const isProd = !!env.production;
    // `true` if the build was called using `vercel dev`
    const ofVervelDev = !!process.env.VERCEL_DEV;
    const isDev = !isProd || ofVervelDev;
    console.info('isDev', isDev);
    // Plugins to be used only for production builds.
    const prodPlugins = [
        new MiniCssExtractPlugin({
            filename: isProd ? '[name].[contenthash].css' : '[name].css',
            chunkFilename: isProd ? '[id].[contenthash].css' : '[id].css'
        })
    ];
    // Plugins
    const plugins: WebpackPluginInstance[] = [
        new ProgressPlugin(),
        new Dotenv({
            systemvars: true
        }),
        // new DefinePlugin({
        //     __LOCAL_DEV__: JSON.stringify(isDev)
        // }),
        new HtmlWebpackPlugin({
            templateContent: defaultTemplate,
            title: 'loomjs'
        }),
        // For production builds only.
        ...[].concat((isProd ? prodPlugins : []) as any),
        new CopyPlugin({
            patterns: ['./assets/**/*'].concat(isDev ? './mocks/**/*' : [])
        }),
        // After emit - output post-processing (prerendering for SSG.)
        new PrerenderSsgWebpackPlugin({
            port: port4002,
            routes: [
                '/',
                '/learn',
                '/learn/concepts',
                '/learn/guides',
                '/learn/api'
            ],
            waitForManual: true
        })
    ];
    // Rules
    const fontsRuleSet: RuleSetRule = {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource'
    };
    const stylesRuleSet: RuleSetRule = {
        test: /\.(css|scss)$/,
        use: [
            // Creates `style` nodes from JS strings
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            {
                // Translates CSS into CommonJS
                loader: 'css-loader',
                options: {
                    importLoaders: 1,
                    modules: {
                        exportLocalsConvention: 'camelCaseOnly',
                        localIdentName: '[local]___[hash:base64:5]'
                    },
                    sourceMap: true
                }
            },
            {
                // Compiles Sass to CSS
                loader: 'sass-loader',
                options: {
                    implementation: require('sass'),
                    sassOptions: {
                        includePaths: [path.resolve(CWD, 'src/styles')]
                    }
                }
            }
        ]
    };
    const tsRuleSet: RuleSetRule = {
        exclude: /node_modules/,
        include: [path.resolve(CWD, 'lib'), path.resolve(CWD, 'src')],
        test: /\.ts$/,
        loader: 'ts-loader'
    };
    // Webpack config
    const config: Configuration & {
        devServer?: WebpackOptionsNormalized['devServer'];
    } = { plugins };

    config.devtool = isProd ? 'source-map' : 'eval-source-map';
    config.devServer = {
        historyApiFallback: true,
        port: port4001
    };
    config.entry = {
        app: { dependOn: 'shared', import: './src/app.ts' },
        shared: ['@loomjs/core', 'classnames']
    };
    config.mode = isProd && !ofVervelDev ? 'production' : 'development';
    config.module = { rules: [tsRuleSet, stylesRuleSet, fontsRuleSet] };
    config.output = {
        clean: true,
        filename: '[name].[contenthash].bundle.js',
        path: path.resolve(__dirname, 'build'),
        publicPath: '/'
    };
    config.resolve = {
        alias: {
            // '@loomjs/core': path.join(CWD, 'src/framework'),
            // '@loomjs/core/dist/types': path.join(
            //     CWD,
            //     'src/framework/types'
            // ),
            '@app': path.join(CWD, 'src')
        },
        extensions: ['.css', '.js', '.scss', '.ts'],
        modules: ['node_modules', path.resolve(__dirname)]
    };
    config.target = 'web';

    return config;
};

// .tsconfig
// "@loomjs/core/*": ["src/framework/*"],
// "@loomjs/core/dist/types": ["src/framework/types"]

// "@loomjs/core/types/*": [
//     "@loomjs/core/dist/types/*"
// ]
