var assert =require('assert');
var thunkify = require('thunkify');
var request = thunkify(require('request'));
var utils = require('./utils/utils.js');

var koaProxy = function(options) {
  assert.ok(options && Object === options.constructor, 'Options Object Required');

  return function* (next) {
    if (utils.resolvePath(this.request.path, options.map)) {
      var opts = {
        method: this.request.method,
        url: utils.resolvePath(this.request.path, options.map),
        headers: this.request.header,
        body: utils.resolveBody(this.request)
      };

      opts.json = this.request.is('json') === 'json';
      opts.qs = !!options.keepQueryString ? this.request.query : {};

      var response = yield request(opts);
      if (typeof response[0].body === 'string' && response[0].body.indexOf('Cannot GET ') !== -1) {
        return this.response.status = response[0].statusCode;
      }
      this.response.set(response[0].headers);
      this.response.body = response[0].body;
      return null;
    }

    yield next;
  };
};

module.exports = koaProxy;