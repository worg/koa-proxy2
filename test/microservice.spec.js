var http = require('http');
var request = require('superagent');
var should = require('should');
var koa = require('koa');
var proxy = require('../index');
var express = require('./mock/server.js');

describe('koa-proxy2 micro service support', function () {
  var server
    , proxy_server
    , app;

  before(function () {
    server = http.createServer(express).listen(5005);
  });

  it('should transfer the request next when rules match, methods not match', function (done) {
    app = koa();
    app.use(proxy({
      proxy_rules: [{
        proxy_micro_service: true,
        proxy_location: '/product/listProduct/',
        proxy_pass: 'http://localhost:5005'
      }]
    }));

    proxy_server = http.createServer(app.callback()).listen(5006);

    request
      .get('http://localhost:5006/product/listProduct/')
      .end(function(err, res) {
        res.body.should.have.property('data', 'Micro Service');
        done();
      })
  });

  it('should transfer the request next when rules match, methods not match', function (done) {
    app = koa();
    app.use(proxy({
      proxy_rules: [{
        proxy_micro_service: false,
        proxy_location: '/product/listProduct/',
        proxy_pass: 'http://localhost:5005'
      }]
    }));

    proxy_server = http.createServer(app.callback()).listen(5006);

    request
      .get('http://localhost:5006/product/listProduct/')
      .end(function(err, res) {
        res.body.should.have.property('data', 'Not Micro Service');
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
