"use strict";

var http = require('http');
var fs = require('fs');
var path = require('path');
var koa = require('koa');
var request = require('superagent');
var should = require('should');
var sinon = require('sinon');
var utils = require('../utils/utils.js');

describe('utils path resolve function', function () {
  var rules;

  it('should support exact math', function () {
    rules = [{
      proxy_location: '/v1/version/',
      proxy_pass: 'http://192.168.100.40'
    }];

    utils.resolvePath('/v1/version/', rules).should.equal('http://192.168.100.40/v1/version/');
  });

  it('should support regular expression math', function () {
    rules = [{
      proxy_location: /^\/hunter/,
      proxy_pass: 'http://192.168.100.40'
    }];

    utils.resolvePath('/hunter/animals/', rules).should.equal('http://192.168.100.40/hunter/animals/');
  });

  it('should support URL postfix', function () {
    rules = [{
      proxy_location: /user\/$/,
      proxy_pass: 'http://www.reverseflower.com/list/'
    }];

    utils.resolvePath('/world/user/', rules).should.equal('http://www.reverseflower.com/list/')
  });

  it('should support URL postfix with proxy_merge_mode', function () {
    rules = [{
      proxy_location: /user\/$/,
      proxy_pass: 'http://www.reverseflower.com/list/',
      proxy_merge_mode: true
    }];

    utils.resolvePath('/world/user/', rules).should.equal('http://www.reverseflower.com/list/world/user/')
  });

  it('should support micro service', function () {
    var rules = [{
      proxy_location: '/product/listProduct/',
      proxy_pass: 'http://www.reverseflower.com',
      proxy_micro_service: true
    }];

    utils.resolvePath('/product/listProduct/', rules).should.equal('http://www.reverseflower.com/listProduct/')
  });

  it('should support micro service', function () {
    var rules = [{
      proxy_location: '/product/listProduct/',
      proxy_pass: 'http://www.reverseflower.com',
      proxy_micro_service: false
    }];

    utils.resolvePath('/product/listProduct/', rules).should.equal('http://www.reverseflower.com/product/listProduct/')
  });

  it('should support micro service with proxy merge mode', function () {
    var rules = [{
      proxy_location: '/orgApi/personal/credit/',
      proxy_pass: 'http://www.reverseflower.com/api',
      proxy_micro_service: true,
      proxy_merge_mode: true
    }];

    utils.resolvePath('/orgApi/personal/credit/', rules).should.equal('http://www.reverseflower.com/api/personal/credit/')
  });

  it('should prompt false when mismatch', function () {
    utils.resolvePath('/hello/world/', rules).should.be.false;
  });
});

describe('utils parse body request environment', function () {
  var app, server;

  beforeEach(function () {
    app = koa();
  });

  it('should parse urlencoded body correctly', function (done) {
    app.use(function *() {
      this.body = yield utils.resolveBody(this);
      this.body.should.have.property('hello', 'world');
      this.body.should.have.property('butterfly', 'pretty');
      done();
    });

    server = http.createServer(app.callback()).listen(5004);

    request
      .post('http://localhost:5004')
      .send('hello=world')
      .send('butterfly=pretty')
      .end();
  });

  it('should parse json body correctly', function (done) {
    app.use(function *() {
      this.body = yield utils.resolveBody(this);
      this.body.should.have.property('love', 'strength');
      this.body.should.have.property('age', 23);
      done();
    });

    server = http.createServer(app.callback()).listen(5004);

    request
      .post('http://localhost:5004')
      .send({love: 'strength', age: 23})
      .end();
  });

  it('should parse text plain body correctly', function (done) {
    app.use(function *() {
      this.body = yield utils.resolveBody(this);
      this.body.should.equal('live long enough to become bad guy');
      done();
    });

    server = http.createServer(app.callback()).listen(5004);

    request
      .post('http://localhost:5004')
      .type('text/plain')
      .send('live long enough to become bad guy')
      .end();
  });

  afterEach(function () {
    server.close();
    app = null;
    server = null;
  });
});

describe('utils parse body automatically choose mode', function () {
  var context = {};

  beforeEach(function () {
    context.is = sinon.stub();
  });

  it('should execute co-body way', function () {
    context.is.returns('json');
    utils.execParseBody(context, true).should.equal('co-body');
  });

  it('should execute multipart way', function () {
    context.is.onCall(0).returns(false);
    context.is.onCall(1).returns('multipart');
    utils.execParseBody(context, true).should.equal('multipart');
  });

  it('should execute none content way', function () {
    context.is.returns(false);
    utils.execParseBody(context, true).should.eql({});
  });
});

describe('utils parse body automatically request environment', function () {
  var app, server;

  beforeEach(function () {
    app = koa();
  });

  it('should parse urlencoded body correctly through automatic mode', function (done) {
    app.use(function *(next) {
      var self = this;
      this.body = yield utils.execParseBody(self);
      yield next;
    });
    app.use(function *() {
      this.body.should.have.property('hello', 'world');
      this.body.should.have.property('butterfly', 'pretty');
      done();
    });

    server = http.createServer(app.callback()).listen(5005);

    request
      .post('http://localhost:5005')
      .send('hello=world')
      .send('butterfly=pretty')
      .end();
  });

  it('should parse multipart body correctly through automatic mode', function (done) {
    app.use(function *(next) {
      var self = this;
      this.body = yield utils.execParseBody(self);
      yield next;
    });

    app.use(function *() {
      this.body.should.have.property('title', 'koa-proxy');
      this.body.should.have.property('content', 'kiss you');
      this.body.should.have.property('youth', new Buffer('youth is not a time of life!'));
      done();
    });

    server = http.createServer(app.callback()).listen(5005);

    request
      .post('http://localhost:5005')
      .field('title', 'koa-proxy')
      .field('content', 'kiss you')
      .attach('youth', fs.createReadStream(path.join(__dirname, 'mock/youth.txt')))
      .end()
  });

  afterEach(function () {
    server.close();
    app = null;
    server = null;
  });
});

describe('utils should skip next', function () {
  var context, options, rules;

  beforeEach(function () {
    context = {
      path: '/hello/world',
      method: 'OPTIONS'
    } ;
    options = {
      proxy_methods: ['GET', 'POST', 'PUT', 'DELETE'],
      proxy_rules: [
        {
          proxy_location: /user\/$/,
          proxy_pass: 'http://www.reverseflower.com/list/'
        }
      ]
    };
  });

  it('should judge whether skip into next', function () {
    utils.shouldSkipNext(context, options).should.be.true;
  });

  it('should judge whether skip into next', function () {
    context.method = 'GET';
    utils.shouldSkipNext(context, options).should.be.true;
  });

  it('should judge whether skip into next', function () {
    context.path = '/list/user/';
    utils.shouldSkipNext(context, options).should.be.true;
  });

  it('should judge whether skip into next', function () {
    context.path = '/list/user/';
    context.method = 'GET';
    utils.shouldSkipNext(context, options).should.be.false;
  });
});

describe('utils should parse body', function () {
  var context, options;

  beforeEach(function () {
    context = { request: { body: {} } };
    options = { body_parse: false}
  });

  it('should judge whether to parse request body', function () {
    utils.shouldParseBody(context, options).should.be.false;
  });

  it('should judge whether to parse request body', function () {
    options.body_parse = true;
    utils.shouldParseBody(context, options).should.be.false;
  });

  it('should judge whether to parse request body', function () {
    delete context.request.body;
    utils.shouldParseBody(context, options).should.be.false;
  });

  it('should judge whether to parse request body', function () {
    delete context.request.body;
    options.body_parse = true;
    utils.shouldParseBody(context, options).should.be.true;
  });
});

describe('utils mergeSafeUrl mode', function () {
  var expect = 'https://github.com/bornkiller/koa-proxy2'
    , source
    , addition;

  it('should support safe url merge', function () {
    source = 'https://github.com/bornkiller';
    addition = 'koa-proxy2';
    utils.mergeSafeUrl(source, addition).should.equal(expect);
  });

  it('should support safe url merge', function () {
    source = 'https://github.com/bornkiller/';
    addition = '/koa-proxy2';
    utils.mergeSafeUrl(source, addition).should.equal(expect);
  });

  it('should support safe url merge', function () {
    source = 'https://github.com/bornkiller/';
    addition = 'koa-proxy2';
    utils.mergeSafeUrl(source, addition).should.equal(expect);
  });

  it('should support safe url merge', function () {
    source = 'https://github.com/bornkiller';
    addition = '/koa-proxy2';
    utils.mergeSafeUrl(source, addition).should.equal(expect);
  });
});

describe('config request opts within different request environment', function () {
  var context = {
    method: 'GET',
    path: '/list/user/',
    header: {},
    query: { title: 'hello' },
    request: {}
  };
  var options = {
    keep_query_string: true,
    proxy_rules: [{
      proxy_location: /user\/$/,
      proxy_pass: 'http://www.reverseflower.com/list/'
    }]
  };
  var result = null;

  it('should config none-content configurations', function () {
    context.is = sinon.stub().returns(false);
    result = utils.configRequestOptions(context, options);
    result.should.have.property('url', 'http://www.reverseflower.com/list/');
    result.should.have.property('qs', { title: 'hello' });
  });

  it('should config none-content configurations', function () {
    context.is = sinon.stub().returns(false);
    options.keep_query_string = false;
    result = utils.configRequestOptions(context, options);
    result.should.have.property('url', 'http://www.reverseflower.com/list/');
    result.should.have.property('qs', {});
  });

  it('should not config content related when request body empty', function () {
    result = utils.configRequestOptions(context, options);
    result.should.not.have.ownProperty('form');
    result.should.not.have.ownProperty('formData');
    result.should.not.have.ownProperty('body');
  });

  it('should config form when x-www-form-urlencoded', function () {
    context.is = sinon.stub().returns('urlencoded');
    context.request.body = 'title=hello&content=world';
    result = utils.configRequestOptions(context, options);
    result.should.have.ownProperty('form');
    result.should.not.have.ownProperty('formData');
    result.should.not.have.ownProperty('body');
  });

  it('should config form when multipart', function () {
    context.is = sinon.stub().returns('multipart');
    context.request.body = new Buffer('hello world');
    result = utils.configRequestOptions(context, options);
    result.should.have.ownProperty('formData');
    result.should.not.have.ownProperty('form');
    result.should.not.have.ownProperty('body');
  });

  it('should config form when application/json ', function () {
    context.is = sinon.stub().returns('json');
    context.request.body = { hello: 'world' };
    result = utils.configRequestOptions(context, options);
    result.should.have.ownProperty('body');
    result.should.have.property('json', true);
    result.should.not.have.ownProperty('form');
    result.should.not.have.ownProperty('formData');
  });

  it('should config form when text/plain', function () {
    context.is = sinon.stub().returns(false);
    context.request.body = 'hello world!';
    result = utils.configRequestOptions(context, options);
    result.should.have.ownProperty('body');
    result.should.have.property('json', false);
    result.should.not.have.ownProperty('form');
    result.should.not.have.ownProperty('formData');
  });
});