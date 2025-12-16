"use strict";

const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const webpackConfig = require("./webpack.config");

const compiler = webpack(webpackConfig);

const devServerOptions = {
    hot: true,
    open: true,
    historyApiFallback: true,
    static: {
        directory: "./web",
    },
    port: 9091,
};

const server = new WebpackDevServer(devServerOptions, compiler);

const runServer = async () => {
    console.log("Starting server...");
    await server.start();
};

runServer();
