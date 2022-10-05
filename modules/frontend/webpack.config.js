const path = require('path');
const webpack = require('webpack');

const TARGET_DIR = path.resolve(__dirname, 'target');
const SRC_DIR = path.resolve(__dirname, 'src');
const COMMONS_DIR = path.join(__dirname, '../commons/');

const config = {
  entry: SRC_DIR + '/js/client.ts',
  output: {
    path: TARGET_DIR,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        // Compile .ts and .tsx files
        test: /\.tsx?$/,
        use: 'ts-loader'
      },
      {
        test: /\.(css|less)$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
	resolve: {
		// We want to be able to include .jsx and .tsx modules without explicitly stating the extension JSX.
		extensions: ['*', '.js', '.json', '.jsx', '.ts', '.tsx'],
		fallback: {
			"fs": false,
      "crypto": require.resolve('crypto-browserify'),
      "stream": require.resolve('stream-browserify')		
    }
	},
	plugins: [
		new webpack.ProvidePlugin({
		  Buffer: ['buffer', 'Buffer'],
			process: 'process/browser'
		}),
	],
	externals: {
		// In cpexcel.js file (from xlsx-style package), there is a conditional require for cptable module. 
		// It is never used, but webpack tries to bundle it and fails with an error.
		// This is simply to avoid that error
		"./cptable": "cptable" 
	},
  devtool: "cheap-module-source-map",
  devServer: {
    port: 58182,
    static: [
        path.join(SRC_DIR, 'assets')
    ],

    historyApiFallback: {
      index: 'index.html'
    },

    // Proxy to forward the API reqests
    proxy: {
        '/api': 'http://localhost:58180'
    }
  }
};

module.exports = config;