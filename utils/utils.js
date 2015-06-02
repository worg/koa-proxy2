"use strict";

/*
 * module dependency
 */
var assert = require('assert');
var fs = require('fs');
var util = require('util');
var _ = require('underscore');
var parse = require('co-body');
var multipart = require('./multipart');

/**
 * Export several useful method
 * @module utils/utils
 * @author bornkiller <hjj491229492@hotmail.com>
 * @version v0.9.0
 * @license MIT
 * @copyright bornkiller NPM package 2014
 */

/**
 * @description resolve rules match, return final URL when match, false when mismatch
 * @param {string} path - the http request path
 * @param {object} rules - the map relationship between origin request path and real backend API
 * @returns {boolean|string}
 */
exports.resolvePath = function(path, rules) {
  assert.ok(util.isArray(rules), 'Array Rules Required');
  var result = _.find(rules, function(rule) {
    return util.isRegExp(rule.proxy_location) ? rule.proxy_location.test(path) : rule.proxy_location === path;
  });

  if (!result) return false;
  return result.proxy_pass.replace(new RegExp('https?:\/\/'), '').indexOf('/') === -1 ? result.proxy_pass + path : result.proxy_pass;
};


/**
 * parse multipart/form-data body and stream next
 * @param {object} req - koa context
 * @returns {Function} - yieldable Object
 */
exports.resolveBody = function(req) {
  return parse(req);
};

/**
 * @description - choose right mode for parse request body
 * @param {object} self - koa request context
 * @param {boolean} debug - whether in UT environment
 * @returns {Object} - yieldable object
 */
exports.execParseBody = function(self, debug) {
  // parse body when raw-body
  if (_.isString(self.is('json', 'text', 'urlencoded'))) return !debug ? parse(self) : 'co-body';
  if (_.isString(self.is('multipart'))) return !debug ? multipart(self) : 'multipart';
  return {};
};

/**
 * @description - config body content for final HTTP request
 * @param {object} self - koa request context
 * @param {object} options - proxy config options
 * @returns {Object} - content configuration pass into request module
 */
exports.configRequestOptions = function(self, options) {
  // resolve available opts for request module
  var opts = {
    method: self.method,
    url: this.resolvePath(self.path, options.proxy_rules),
    headers: self.header,
    qs: !!options.keep_query_string ? self.query : {}
  };

  switch (true) {
    case self.is('urlencoded') === 'urlencoded':
      opts.form = self.request.body;
      break;
    case self.is('multipart') === 'multipart':
      opts.formData = self.request.body;
      break;
    default:
      opts.body = self.request.body;
      opts.json = self.is('json') === 'json'
  }
  return opts;
};

/**
 * @description - whether should parse request body inner koa-proxy2
 * @param {object} self - koa request context
 * @param {object} options - configure options
 * @returns {Boolean}
 */
exports.shouldSkipNext = function(self, options) {
  return !this.resolvePath(self.path, options.proxy_rules) || options.proxy_methods.indexOf(self.method) === -1
};

/**
 * @description - whether should parse request body inner koa-proxy2
 * @param {object} self - koa request context
 * @param {object} options - passed options
 * @returns {Boolean}
 */
exports.shouldParseBody = function(self, options) {
  return !self.request.body && options.body_parse
};