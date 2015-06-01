/**
 * @external formidable
 * @see https://www.npmjs.com/package/formidable
 */

"use strict";

/*
 * module dependency
 */
var assert = require('assert');
var fs = require('fs');
var util = require('util');
var formidable = require('formidable');
var _ = require('underscore');

/**
 * Export several useful method
 * @module utils/utils
 * @requires formidable
 * @requires _
 * @author bornkiller <hjj491229492@hotmail.com>
 * @version v0.9.0
 * @license MIT
 * @copyright bornkiller NPM package 2014
 */

/**
 * @description Judge map rules match, return final URL when match, false when mismatch
 * @param {string} path - the http request path
 * @param {object} rules - the map relation between origin request path and real backend API
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
 * @param {object} req - koa context or koa request wrapper
 * @param {object} opts - options pass to formidable module
 * @returns {Function} - yieldable function
 */
exports.resolveMultipart = function(req, opts) {
  req = req.req || req;

  return function(done) {
    var data = {};
    var form = new formidable.IncomingForm(opts);
    form
      .on('field', function(name, value) {
        data[name] = value;
      })
      .on('file', function(name, file) {
        data[name] = fs.readFileSync(file.path)
      })
      .on('error', function(error) {
        done(error);
      })
      .on('end', function() {
        done(null, data);
      });
    form.parse(req);
  }
};