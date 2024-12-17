const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

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
};
