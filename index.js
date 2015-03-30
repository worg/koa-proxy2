/**
 * @external co-body
 * @see https://www.npmjs.com/package/co-body
 */

/**
 * @external thunkify
 * @see https://www.npmjs.com/package/thunkify
 */

/**
 * @external request
 * @see https://www.npmjs.com/package/request
 */

var assert =require('assert');
var util =require('util');
var parse = require('co-body');
var thunkify = require('thunkify');
var request = thunkify(require('request'));
var utils = require('./utils/utils.js');

/**
 * @typedef {Object} ProxyOption
 * @property {!Object} map - define the proxy rules with normal string, `=` prefix for complete match, `~` prefix for
 * regexp match case sensitive, `~*` prefix just almost the same as `~`, except case insensitive
 * @property {!Boolean} keepQueryString - whether preserve the query string for final request URL
 * @property {Function} [transformResponse] - post resolve the response
 * @property {Object} [formidable] - options for formidable module configure
 */

/**
 * A module proxy requests with nginx style
 * @exports koa-proxy
 * @version v0.7.2
 * @requires utils
 * @param {ProxyOption} options - proxy options and formidable options
 * @returns {Function} - generator function act koa middleware
 */
var koaProxy = function(options) {
  assert.ok(options && Object === options.constructor, 'Options Object Required');

  return function* (next) {
    var bodyEnabled = true;

    // skip body parse when parsed
    if (!this.request.body && this.method !== 'get' && this.method !== 'delete') {
      // parse body when raw-body
      if (this.is('json', 'text', 'urlencoded')) this.request.body = yield parse(this);
      if (this.is('multipart')) {
        bodyEnabled = false;
        this.request.body = yield utils.resolveMultipart(this, options.formidable || {});
      }
    }

    // respond error when occur in body parse
    if (util.isError(this.request.body)) return this.status = 500;

    // proxy request when map rules match
    if (utils.resolvePath(this.path, options.map)) {
      // resolve available opts for request module
      var opts = {
        method: this.method,
        url: utils.resolvePath(this.path, options.map),
        headers: this.header
      };

      opts.body = bodyEnabled ? utils.resolveBody(this) : null;
      opts.formData = !bodyEnabled ? this.request.body : null;
      opts.json = this.is('json') === 'json';
      opts.qs = !!options.keepQueryString ? this.query : {};


      // comply the proxy
      var response = yield request(opts);

      // respond client
      this.status = response[0].statusCode;
      this.set(response[0].headers);
      this.body = response[0].body;
      if (typeof options.transformResponse === 'function') options.transformResponse.apply(this);
      return null;
    }

    yield next;
  };
};

module.exports = koaProxy;