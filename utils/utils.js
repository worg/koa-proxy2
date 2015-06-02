"use strict";

/*
 * module dependency
 */
var assert = require('assert');
var fs = require('fs');
var util = require('util');
var parse = require('co-body');
var _ = require('underscore');

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

exports.execParseBody = function(self) {
  // parse body when raw-body
  if (_.isString(self.is('json', 'text', 'urlencoded'))) return parse(self);
  if (_.isString(self.is('multipart'))) return this.resolveMultipart(self);
  return {};
};

/**
 * @description - config body content for final HTTP request
 * @param {object} self - koa request context
 * @returns {Object} - content configuration pass into request module
 */
exports.configRequestBody = function(self) {
  var opts = {};
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
 * @param {Array.<ProxyOption>} rules - proxy rule definition
 * @param {object} options - passed options
 * @returns {Boolean}
 */
exports.shouldSkipNext = function(self, rules, options) {
  return !this.resolvePath(self.path, rules) || options.proxy_methods.indexOf(self.method) === -1
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