"use strict";

var fs = require('fs');
var path = require('path');
var http = require('http');
var koa = require('koa');
var request = require('superagent');
var should = require('should');
var multipart = require('../utils/multipart');

describe('multipart parse function', function () {
  var app = koa(), server;

  it('should parse multipart body correctly', function (done) {
    app.use(function *() {
      this.body = yield multipart(this.req);
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
      .end()
  });
});
