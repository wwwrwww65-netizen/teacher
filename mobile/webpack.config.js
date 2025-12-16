const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const appDirectory = path.resolve(__dirname);
const { presets } = require(`${appDirectory}/babel.config.js`);

const compileNodeModules = [
    'react-native-reanimated',
    'react-native-vector-icons',
    'react-native-safe-area-context',
    'react-native-svg',
].map((moduleName) => path.resolve(appDirectory, `node_modules/${moduleName}`));

const babelLoaderConfiguration = {
    test: /\.(js|jsx|ts|tsx)$/,
    include: [
        path.resolve(appDirectory, 'index.web.js'),
        path.resolve(appDirectory, 'src'),
        path.resolve(appDirectory, 'web'),
        path.resolve(appDirectory, 'node_modules/react-native-uncompiled'),
        ...compileNodeModules,
    ],
    use: {
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            presets,
            plugins: [
                'react-native-web',
                [
                    'module-resolver',
                    {
                        alias: {
                            '^react-native$': 'react-native-web',
                        }
                    }
                ],
                'react-native-reanimated/plugin',
                '@babel/plugin-proposal-export-namespace-from'
            ],
        },
    },
};

const imageLoaderConfiguration = {
    test: /\.(gif|jpe?g|png|svg)$/,
    use: {
        loader: 'url-loader',
        options: {
            name: '[name].[ext]',
            esModule: false,
        },
    },
};

const cssLoaderConfiguration = {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
};

module.exports = {
    entry: path.resolve(appDirectory, 'index.web.js'),

    output: {
        filename: 'bundle.web.js',
        path: path.resolve(appDirectory, 'dist'),
        publicPath: '/',
    },

    module: {
        rules: [
            babelLoaderConfiguration,
            imageLoaderConfiguration,
            cssLoaderConfiguration,
        ],
    },

    resolve: {
        alias: {
            'react-native$': 'react-native-web',
            'react-native-sound-player': path.resolve(appDirectory, 'web/mocks.js'),
            '@react-native-voice/voice': path.resolve(appDirectory, 'web/mocks.js'),
            'react-native-fs': path.resolve(appDirectory, 'web/mocks.js'),
            'react-native-image-picker': path.resolve(appDirectory, 'web/mocks.js'),
            '@react-native-async-storage/async-storage': path.resolve(appDirectory, 'web/mocks.js'),
            'react-native-tts': path.resolve(appDirectory, 'web/mocks.js'),
        },
        extensions: ['.web.js', '.js', '.jsx', '.ts', '.tsx'],
    },

    mode: 'development',
    devServer: {
        static: {
            directory: path.join(appDirectory, 'web'),
        },
        compress: true,
        port: 8080,
        historyApiFallback: true,
        hot: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(appDirectory, 'web/index.html'),
        }),
        new webpack.DefinePlugin({
            __DEV__: process.env.NODE_ENV !== 'production',
            process: { env: {} }
        }),
    ],
};
