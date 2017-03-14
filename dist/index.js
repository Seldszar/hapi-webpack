'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.register = register;

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _webpackDevMiddleware = require('webpack-dev-middleware');

var _webpackDevMiddleware2 = _interopRequireDefault(_webpackDevMiddleware);

var _webpackHotMiddleware = require('webpack-hot-middleware');

var _webpackHotMiddleware2 = _interopRequireDefault(_webpackHotMiddleware);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates the configuration object.
 */
function makeConfig(options) {
  const schema = {
    compiler: [_joi2.default.object(), _joi2.default.string().default('webpack.config.js')],
    assets: _joi2.default.object().default({}),
    hot: _joi2.default.object().default({})
  };

  return _joi2.default.attempt(options, schema);
}

/**
 * Creates the Webpack compiler.
 */
/* eslint-disable global-require, import/no-dynamic-require, import/prefer-default-export */

function makeCompiler(options) {
  if (options instanceof _webpack2.default) {
    return options;
  }

  if (typeof options === 'string') {
    const webpackConfigPath = _path2.default.resolve(options);
    const webpackConfig = require(webpackConfigPath);

    return new _webpack2.default(webpackConfig);
  }

  return new _webpack2.default(options);
}

/**
 * Registers the plugin.
 */
function register(server, options, next) {
  const config = makeConfig(options);
  const compiler = makeCompiler(config.compiler);

  // Configures middlewares
  const webpackDevMiddleware = (0, _webpackDevMiddleware2.default)(compiler, config.assets);
  const webpackHotMiddleware = (0, _webpackHotMiddleware2.default)(compiler, config.hot);

  // Handles WebpackDevMiddleware
  server.ext('onRequest', (request, reply) => {
    const { req, res } = request.raw;

    webpackDevMiddleware(req, res, error => {
      if (error) {
        return reply(error);
      }

      return reply.continue();
    });
  });

  // Handles WebpackHotMiddleware
  server.ext('onRequest', (request, reply) => {
    const { req, res } = request.raw;

    webpackHotMiddleware(req, res, error => {
      if (error) {
        return reply(error);
      }

      return reply.continue();
    });
  });

  // Expose the Webpack compiler.
  server.expose({ compiler });

  return next();
}

register.attributes = {
  name: 'webpack',
  pkg: require('../package.json')
};