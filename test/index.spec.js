var http = require('http');
var request = require('superagent');
var should = require('should');
var koa = require('koa');
var proxy = require('../index');
var express = require('./mock/server.js');

describe('proxy server', function () {
  var server
    , proxy_server
    , app;

  before(function () {
    server = http.createServer(express).listen(5000);
  });

  it('should transfer next when rules none mismatch', function (done) {
    app = koa();
    app.use(proxy([]));
    app.use(function *() {
      this.body = 'transfer stream';
    });
    proxy_server = http.createServer(app.callback()).listen(5001);

    request
      .get('http://localhost:5001')
      .end(function(err, res) {
        res.text.should.equal('transfer stream');
        done();
      })
  });

  it('should execute the proxy when rules match', function (done) {
    app = koa();
    app.use(proxy([{
        proxy_location: '/version/',
        proxy_pass: 'http://localhost:5000/proxy/'
      }]
    ));

    proxy_server = http.createServer(app.callback()).listen(5001);

    request
      .get('http://localhost:5001/version/')
      .end(function(err, res) {
        res.body.should.have.property('title', 'love is color blind!');
        res.body.should.have.property('content', 'youth is not a time of life!');
        done();
      })
  });

  it('should transfer the request next when rules match, methods not match', function (done) {
    app = koa();
    app.use(proxy([{
        proxy_location: '/version/',
        proxy_pass: 'http://localhost:5000/proxy/'
      }], {
        proxy_methods: ['POST', 'PUT']
      }
    ));
    app.use(function *() {
      this.body = 'transfer stream';
    });

    proxy_server = http.createServer(app.callback()).listen(5001);

    request
      .get('http://localhost:5001/version/')
      .end(function(err, res) {
        res.text.should.equal('transfer stream');
        done();
      })
  });


  afterEach(function () {
    proxy_server.close();
  });

  after(function () {
    server.close();
  });
});