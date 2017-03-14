/* eslint-disable global-require, import/no-dynamic-require, import/prefer-default-export */

import Joi from 'joi';
import Path from 'path';

import Webpack from 'webpack';
import WebpackDevMiddleware from 'webpack-dev-middleware';
import WebpackHotMiddleware from 'webpack-hot-middleware';


/**
 * Creates the configuration object.
 *
 * @param {Object} options
 * @return {Object}
 */
function makeConfig(options) {
  const schema = {
    compiler: Joi.alternatives(Joi.object(), Joi.string())
      .default('webpack.config.js'),
    assets: Joi.object()
      .default({}),
    hot: Joi.alternatives(Joi.boolean(), Joi.object())
      .default({}),
  };

  return Joi.attempt(options, schema);
}

/**
 * Creates the Webpack compiler.
 *
 * @param {string|Object|Webpack} options
 * @return {Webpack}
 */
function makeCompiler(options) {
  if (options instanceof Webpack) {
    return options;
  }

  if (typeof options === 'string') {
    const webpackConfigPath = Path.resolve(options);
    const webpackConfig = require(webpackConfigPath);

    return new Webpack(webpackConfig);
  }

  return new Webpack(options);
}

/**
 * Registers the plugin.
 */
export function register(server, options, next) {
  const config = makeConfig(options);
  const compiler = makeCompiler(config.compiler);
  const webpackDevMiddleware = WebpackDevMiddleware(compiler, config.assets);

  server.ext('onRequest', (request, reply) => {
    const { req, res } = request.raw;

    webpackDevMiddleware(req, res, (error) => {
      if (error) {
        return reply(error);
      }

      return reply.continue();
    });
  });

  if (typeof config.hot === 'object' || config.hot === true) {
    const webpackHotMiddleware = WebpackHotMiddleware(compiler, config.hot || {});

    server.ext('onRequest', (request, reply) => {
      const { req, res } = request.raw;

      webpackHotMiddleware(req, res, (error) => {
        if (error) {
          return reply(error);
        }

        return reply.continue();
      });
    });
  }

  server.expose({ compiler });
  return next();
}

register.attributes = {
  name: 'webpack',
  pkg: require('../package.json'),
};
