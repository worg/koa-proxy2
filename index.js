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
 * @typedef {!Object} ProxyOption
 * @property {RegExp} proxy_location - URL match for specific path request proxy
 * @property {string} proxy_pass - backend proxy target
 */

/**
 * A module proxy requests with nginx style
 * @module koa-proxy2
 * @version v0.7.2
 * @requires utils
 * @param {Array.<ProxyOption>} rules - proxy rule definition
 * @param {Object} options - proxy config definition
 * @throws {Error} the rules must provide array, even empty
 * @returns {Function} - generator function act koa middleware
 */
module.exports = function(rules, options) {
  assert.ok(util.isArray(rules), 'Array Rules Required');

  options = _.defaults(options, {
    body_parse: true,
    keep_query_string: true,
    proxy_timeout: 3000,
    proxy_methods: ['get', 'post', 'put', 'delete']
  });

  return function* (next) {
    // transfer request next when rules, methods mismatch
    if (!utils.resolvePath(this.path, rules) || options.proxy_methods.indexOf(this.method) === -1) return yield next;

    var multipart = false;

    // skip body parse when parsed or disabled
    if (!this.request.body && options.body_parse) {
      // parse body when raw-body
      if (this.is('json', 'text', 'urlencoded')) this.request.body = yield parse(this);
      if (this.is('multipart')) {
        multipart = true;
        this.request.body = yield utils.resolveMultipart(this);
      }
    }

    // respond error when occur in body parse
    if (util.isError(this.request.body)) return this.status = 500;

    // resolve available opts for request module
    var opts = {
      method: this.method,
      url: utils.resolvePath(this.path, rules),
      headers: this.header
    };

    opts.body = !multipart ? this.request.body : null;
    opts.form = this.is('urlencoded') ? this.request.body : null;
    opts.formData = multipart ? this.request.body : null;
    opts.json = this.is('json') === 'json';
    opts.qs = !!options.keepQueryString ? this.query : {};

    // comply the proxy
    var response = yield request(opts);

    // respond client
    this.status = response[0].statusCode;
    this.set(response[0].headers);
    this.body = response[0].body;
  };
};