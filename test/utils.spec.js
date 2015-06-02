"use strict";

var fs = require('fs');
var path = require('path');
var http = require('http');
var koa = require('koa');
var request = require('superagent');
var should = require('should');
var utils = require('../utils/utils.js');

describe('utils path resolve function', function () {
  var rules = [
    {
      proxy_location: '/v1/version/',
      proxy_pass: 'http://192.168.100.40'
    },
    {
      proxy_location: /^\/hunter/,
      proxy_pass: 'http://192.168.100.40'
    },
    {
      proxy_location: /user\/$/,
      proxy_pass: 'http://www.reverseflower.com/list/'
    }
  ];

  it('should support exact math', function () {
    utils.resolvePath('/v1/version/', rules).should.equal('http://192.168.100.40/v1/version/');
  });

  it('should support regular expression math', function () {
    utils.resolvePath('/hunter/animals/', rules).should.equal('http://192.168.100.40/hunter/animals/');
  });

  it('should support proxy_pass with URL', function () {
    utils.resolvePath('/list/user/', rules).should.equal('http://www.reverseflower.com/list/')
  });

  it('should prompt false when mismatch', function () {
    utils.resolvePath('/hello/world/', rules).should.be.false;
  });
});

describe('utils multipart resolve function', function () {
  var app, server;

  beforeEach(function () {
    app = koa();
  });

  it('should parse multipart body correctly', function (done) {
    app.use(function *() {
      this.body = yield utils.resolveMultipart(this);
      this.body.should.have.property('title', 'koa-proxy');
      this.body.should.have.property('content', 'kiss you');
      this.body.should.have.property('youth', new Buffer('youth is not a time of life!'));
      done();
    });

    server = http.createServer(app.callback()).listen(5000);

    request
      .post('http://localhost:5000')
      .field('title', 'koa-proxy')
      .field('content', 'kiss you')
      .attach('youth', fs.createReadStream(path.join(__dirname, 'mock/youth.txt')))
      .end(function(err, res) {})
  });

  it('should parse multipart body correctly', function (done) {
    app.use(function *() {
      this.body = yield utils.resolveMultipart(this.req);
      this.body.should.have.property('title', 'koa-proxy');
      this.body.should.have.property('content', 'kiss you');
      this.body.should.have.property('youth', new Buffer('youth is not a time of life!'));
      done();
    });

    server = http.createServer(app.callback()).listen(5000);

    request
      .post('http://localhost:5000')
      .field('title', 'koa-proxy')
      .field('content', 'kiss you')
      .attach('youth', fs.createReadStream(path.join(__dirname, 'mock/youth.txt')))
      .end(function(err, res) {})
  });

  afterEach(function () {
    server.close();
  });
});

describe('utils should skip next', function () {
  var context, options, rules;

  beforeEach(function () {
    context = {
      path: '/hello/world',
      method: 'OPTIONS'
    } ;
    options = { proxy_methods: ['GET', 'POST', 'PUT', 'DELETE'] };
    rules = [
      {
        proxy_location: /user\/$/,
        proxy_pass: 'http://www.reverseflower.com/list/'
      }
    ];
  });

  it('should judge whether skip into next', function () {
    utils.shouldSkipNext(context, rules, options).should.be.true;
  });

  it('should judge whether skip into next', function () {
    context.method = 'GET';
    utils.shouldSkipNext(context, rules, options).should.be.true;
  });

  it('should judge whether skip into next', function () {
    context.path = '/list/user/';
    utils.shouldSkipNext(context, rules, options).should.be.true;
  });

  it('should judge whether skip into next', function () {
    context.path = '/list/user/';
    context.method = 'GET';
    utils.shouldSkipNext(context, rules, options).should.be.false;
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

describe('config request content with different form', function () {
  var context, result;

  beforeEach(function () {
    context = { request: {} };
  });

  it('should config form when x-www-form-urlencoded', function () {
    context.is = function(type) { return type === 'urlencoded' ? type : false };
    result = utils.configRequestBody(context);
    Object.keys(result).should.have.length(1);
    result.should.have.ownProperty('form')
  });

  it('should config form when x-www-form-urlencoded', function () {
    context.is = function(type) { return type === 'multipart' ? type : false };
    result = utils.configRequestBody(context);
    Object.keys(result).should.have.length(1);
    result.should.have.ownProperty('formData')
  });

  it('should config form when x-www-form-urlencoded', function () {
    context.is = function(type) { return type === 'json' ? type : false };
    result = utils.configRequestBody(context);
    Object.keys(result).should.have.length(2);
    result.should.have.ownProperty('body');
    result.should.have.property('json', true);
  });

  it('should config form when x-www-form-urlencoded', function () {
    context.is = function(type) { return type === 'json' ? false : false };
    result = utils.configRequestBody(context);
    Object.keys(result).should.have.length(2);
    result.should.have.ownProperty('body');
    result.should.have.property('json', false);
  });
});