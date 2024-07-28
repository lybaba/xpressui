const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack')

module.exports = {
    entry: {
        xpressui: './src/index.tsx',
      },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                options: { allowTsInNodeModules: true },
                exclude: /node_modules/,
            },

            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ]
            }
        ],
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: [".ts", ".tsx", ".js"],
        // Add support for TypeScripts fully qualified ESM imports.
        extensionAlias: {
         ".js": [".js", ".ts"],
         ".cjs": [".cjs", ".cts"],
         ".mjs": [".mjs", ".mts"]
        }
      },

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        chunkFilename: "[name].bundle.js", 
        libraryTarget: 'var',
        library: 'postui'
    },

    optimization: {
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin()
        ],

        /*splitChunks: {
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: "vendor", ///< name of bundle
                chunks: "all" ///< type of code to put in this bundle
              },
            }
        }*/
    },

    plugins: [
        new webpack.DefinePlugin({
            process: 'process/browser',
        }),
        new CleanWebpackPlugin({
            cleanAfterEveryBuildPatterns: ['dist']
        }),
        new HtmlWebpackPlugin({
            title: 'Joosorol',
            template: 'public/index.html'
        }),
        new MiniCssExtractPlugin({
            filename: "bundle.css"
        }),
        new CopyPlugin({
            patterns: [
                { from: "public/img", to: "img" }
            ]
        }),
    ],

    devServer: {
        static: path.join(__dirname, "dist"),
        compress: true,
        port: 4000,
    },

    mode: 'production',
    devtool: 'source-map'
};