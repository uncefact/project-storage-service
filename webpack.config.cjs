const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/server.ts',
    output: {
        libraryTarget: 'umd',
        globalObject: 'this',
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    target: 'node',
    // Externalise all of node_modules. Bundling inlined `express` and the
    // other libraries the auto-instrumentations need to wrap, so
    // OpenTelemetry's require-hook never saw them and no spans were produced
    // in the bundled build. Keeping them as real runtime requires lets
    // `instrumentation-http`, `instrumentation-express`, and the rest patch
    // the modules when they load. The OTLP exporters are also externalised so
    // their native gRPC bindings load against the on-disk install rather than
    // a webpack-bundled copy. The runtime image already ships node_modules,
    // so this is an internal build change.
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: [/node_modules/, /documentation/, /e2e/, /\.test\.ts$/],
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: [/node_modules/, /documentation/, /e2e/, /\.test\.ts$/],
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
