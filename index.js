/**
 * A module proxy requests with nginx style
 * @module koa-proxy
 * @version v0.6.6
 */

/**
 * Module dependencies
 */
var assert =require('assert');
var thunkify = require('thunkify');
var request = thunkify(require('request'));
var parse = require('co-body');
var util =require('util');
var utils = require('./utils/utils.js');

/**
 * Return koa middleware to achieve proxy agent
 * @param {object} [options={}] - proxy and formidable options
 * @returns {Function}
 */
var koaProxy = function(options) {
  assert.ok(options && Object === options.constructor, 'Options Object Required');

  return function* (next) {
    var bodyEnabled = true;

    // skip body parse when parsed
    if (!this.request.body && this.method !== 'get' && this.method !== 'delete') {
      // parse body when raw-body
      if (this.is('json', 'urlencoded')) this.request.body = yield parse(this);
      if (this.is('multipart')) {
        bodyEnabled = false;
        this.request.body = yield utils.resolveMultipart(this, options);
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