const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  // Main process config
  {
    mode: 'development',
    entry: './src/main.ts',
    target: 'electron-main',
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    node: {
      __dirname: false
    }
  },
  // Preload process config
  {
    mode: 'development',
    entry: './src/preload.ts',
    target: 'electron-preload',
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js'
    },
    resolve: {
      extensions: ['.ts', '.js']
    }
  },
  // Renderer process config
  {
    mode: 'development',
    entry: {
      app: './src/renderer/index.tsx'
    },
    target: 'electron-renderer',
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          include: /src/,
          use: [{ loader: 'ts-loader' }]
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: '[name].js'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html'
      })
    ]
  }
];
