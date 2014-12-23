var assert =require('assert');
var thunkify = require('thunkify');
var request = thunkify(require('request'));
var parse = require('co-body');
var util =require('util');
var utils = require('./utils/utils.js');

var koaProxy = function(options) {
  assert.ok(options && Object === options.constructor, 'Options Object Required');

  return function* (next) {
    var bodyEnabled = true;
    if (!this.request.body && this.method !== 'get' && this.method !== 'delete') {
      if (this.is('json', 'urlencoded')) this.request.body = yield parse(this);
      if (this.is('multipart')) {
        bodyEnabled = false;
        this.request.body = yield utils.resolveMultipart(this, options);
      }
    }

    if (util.isError(this.request.body)) return this.status = 500;

    if (utils.resolvePath(this.path, options.map)) {
      var opts = {
        method: this.method,
        url: utils.resolvePath(this.path, options.map),
        headers: this.header
      };

      opts.body = bodyEnabled ? utils.resolveBody(this.request) : null;
      opts.formData = !bodyEnabled ? this.request.body : null;
      opts.json = this.is('json') === 'json';
      opts.qs = !!options.keepQueryString ? this.request.query : {};

      var response =
        this.is(['json', 'urlencoded']) ?
        yield request(opts) :
        yield request({
          method: opts.method,
          url: opts.url,
          header: opts.headers,
          body: opts.body,
          formData: opts.formData,
          json: opts.json,
          qs: opts.qs
        });

      if (typeof response[0].body === 'string' && response[0].body.indexOf('Cannot GET ') !== -1) {
        return this.status = response[0].statusCode;
      }
      this.set(response[0].headers);
      this.body = response[0].body;
      return null;
    }

    yield next;
  };
};

module.exports = koaProxy;