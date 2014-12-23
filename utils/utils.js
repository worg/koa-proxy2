/**
 * Export several useful method
 * @module utils
 */

/**
 * Module dependencies
 */

var assert = require('assert');
var formidable = require('formidable');
var fs = require('fs');
var utils = {};

/**
 * Judge map rules match, return final URL when match, false when mismatch
 * @param path
 * @param map
 * @returns {boolean|string}
 */
utils.resolvePath = function(path, map) {
  assert.ok(map && Object === map.constructor, 'Map Object Required');

  var normal = []
    , regExp = []
    , insRegExp = []
    , url
    , pathRegExp;

  var keys = Object.keys(map);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].indexOf('=') !== 0 && keys[i].indexOf('~') !== 0 && keys[i].indexOf('~*') !== 0) normal.push(keys[i]);
    if (keys[i].indexOf('=') === 0) normal.push(keys[i].slice(1));
    if (keys[i].indexOf('~') === 0 && keys[i].indexOf('~*') !== 0) regExp.push(new RegExp(keys[i].slice(1)));
    if (keys[i].indexOf('~*') === 0) insRegExp.push(new RegExp(keys[i].slice(2), 'i'));
  }

  if (normal.some(function(value) { return value === path})) {
    url = map[path] ? map[path] : map['=' + path];
    return url.replace(new RegExp('https?:\/\/'), '').indexOf('/') === -1 ? url + path : url;
  }

  pathRegExp = regExp.filter(function(value) { return value.test(path);});
  if (pathRegExp.length !== 0) {
    url = map['~' + pathRegExp[0].toString().replace(new RegExp('^\/'), '').replace(new RegExp('\/$'), '')];
    return url.replace(new RegExp('https?:\/\/'), '').indexOf('/') === -1 ? url + path : url;
  }

  pathRegExp = insRegExp.filter(function(value) { return value.test(path);});
  if (pathRegExp.length !== 0) {
    url = map['~*' + pathRegExp[0].toString().replace(new RegExp('^\/'), '').replace(new RegExp('\/i$'), '')];
    return url.replace(new RegExp('https?:\/\/'), '').indexOf('/') === -1 ? url + path : url;
  }

  return false;
};

/**
 * revert parsed body into original structure
 * @param {object} request - koa context or origin request
 * @returns {string|object|null}
 */
utils.resolveBody = function(request) {
  request = request.request || request;
  if (request.is('application/x-www-form-urlencoded')) return utils.serialize(request.body);
  if (request.is('json')) return request.body;
  return null;
};

/**
 * serialize object into x-www-form-urlencoded string
 * @param {object} obj - parsed body
 * @returns {string}
 */
utils.serialize = function(obj) {
  if (!(Object == obj.constructor)) return '';
  var result = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
    }
  }
  return result.join('&');
};

/**
 * parse multipart/form-data body and stream next
 * @param {object} req - koa context or koa request wrapper
 * @param {object} opts - options pass to formidable module
 * @returns {Function} - yieldable function
 */
utils.resolveMultipart = function(req, opts) {
  req = req.req || req;

  return function(done) {
    var data = {};
    var form = new formidable.IncomingForm(opts);
    form
      .on('field', function(name, value) {
        data[name] = value;
      })
      .on('file', function(name, file) {
        data[name] = fs.createReadStream(file.path)
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

module.exports = utils;