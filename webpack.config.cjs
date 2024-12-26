const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/server.ts',
    output: {
        libraryTarget: 'umd',
        globalObject: 'this',
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: [/node_modules/, /documentation/],
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: [/node_modules/, /documentation/],
                options: {
                    presets: ['@babel/preset-env'],
                },
            },
        ],
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: /AbortSignal/,
                    sourceMap: true,
                },
            }),
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                './node_modules/swagger-ui-dist/swagger-ui.css',
                './node_modules/swagger-ui-dist/swagger-ui-bundle.js',
                './node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js',
                './node_modules/swagger-ui-dist/favicon-16x16.png',
                './node_modules/swagger-ui-dist/favicon-32x32.png',
            ],
        }),
    ],
};
