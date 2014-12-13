var assert =require('assert');
var thunkify = require('thunkify');
var request = thunkify(require('request'));

var koaProxy = function(options) {
  assert.ok(options && Object === options.constructor, 'Options Object Required');

  return function* (next) {
    if (Object.keys(options.map).indexOf(this.request.path) !== -1) {
      var opts = {
        method: this.request.method,
        url: options.map[this.request.path],
        headers: this.request.header,
        body: this.request.body
      };

      opts.json = this.request.is('json') === 'json';
      opts.qs = !!options.keepQueryString ? this.request.query : {};

      var response = yield request(opts);
      this.header = response[0].header;
      this.body = response[0].body;
      return null;
    }

    yield next;
  };
};

module.exports = koaProxy;
