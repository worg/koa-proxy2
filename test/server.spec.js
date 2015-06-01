var request = require('superagent');
var should = require('should');
var http = require('http');
var app = require('./mock/server.js');

describe('server for proxy', function () {
  var server;

  before(function () {
   server = http.createServer(app).listen(5001);
  });

  it('should response the specific URL without query string', function (done) {
    request
      .get('http://localhost:5001/proxy/')
      .end(function(err, res) {
        res.body.should.have.property('title', 'love is color blind!');
        res.body.should.have.property('content', 'youth is not a time of life!');
        done();
      })
  });

  it('should response the specific URL with query string', function (done) {
    request
      .get('http://localhost:5001/proxy/')
      .query('title=webstorm&content=jetbrain')
      .end(function(err, res) {
        res.body.should.have.property('title', 'webstorm');
        res.body.should.have.property('content', 'jetbrain');
        done();
      })
  });

  after(function () {
    server.close();
  });
});