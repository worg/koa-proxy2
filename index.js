"use strict";

var assert =require('assert');
var util =require('util');
var parse = require('co-body');
var thunkify = require('thunkify');
var request = thunkify(require('request'));
var _ = require('underscore');
var utils = require('./utils/utils.js');

/**
 * @typedef {!Object} ProxyOption
 * @property {(string|RegExp)} proxy_location - URL match rule for specific path request proxy
 * @property {string} proxy_pass - target backend, different between with URL or not
 */

/**
 * A module proxy requests with nginx style
 * @version v0.9.0
 * @author bornkiller <hjj491229492@hotmail.com>
 * @version v0.9.0
 * @license MIT
 * @copyright bornkiller NPM package 2014
 */

/**
 * @description A module proxy requests with nginx style
 * @module koa-proxy2
 * @requires utils
 * @param {Array.<ProxyOption>} rules - proxy rule definition
 * @param {Object} options - proxy config definition
 * @throws {Error} the rules must provide array, even empty
 * @returns {Function} - generator function act koa middleware
 */
module.exports = function(rules, options) {
  assert.ok(util.isArray(rules), 'Array Rules Required');

  options = _.defaults(options || {}, {
    body_parse: true,
    keep_query_string: true,
    proxy_timeout: 3000,
    proxy_methods: ['GET', 'POST', 'PUT', 'DELETE']
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

    if (multipart) opts.body = this.request.body;
    opts.form = this.is('urlencoded') ? this.request.body : null;
    opts.formData = multipart ? this.request.body : null;
    opts.json = this.is('json') === 'json';
    opts.qs = !!options.keep_query_string ? this.query : {};

    // comply the proxy
    var response = yield request(opts);

    // respond client
    this.status = response[0].statusCode;
    this.set(response[0].headers);
    this.body = response[0].body;
  };
};