var assert = require('assert');
var utils = {};
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

utils.resolveBody = function(request) {
  if (request.is('application/x-www-form-urlencoded')) return utils.serialize(request.body);
  if (request.is('json')) return request.body;
  return '';
};

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

module.exports = utils;