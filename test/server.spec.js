var request = require('superagent');
var should = require('should');
var http = require('http');
var app = require('./mock/server.js');

describe('server for proxy', function () {
  var server;

  beforeEach(function () {
   server = http.createServer(app).listen(5001);
  });

  it('should response the specific URL', function (done) {
    request
      .get('http://localhost:5001/proxy/')
      .end(function(err, res) {
        res.body.should.have.property('title', 'love is color blind!');
        res.body.should.have.property('content', 'youth is not a time of life!');
        done();
      })
  });

  afterEach(function () {
    server.close();
  });
});