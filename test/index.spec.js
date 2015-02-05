var path =require('path');
var fs = require('fs');
var koa =require('koa');
var should = require('should');
var supertest = require('supertest');
var koaProxy = require('../index.js');
var utils = require('../utils/utils.js');
var backServer = require('./mock/backServer.js');

describe('koa proxy options', function () {
  var app;

  beforeEach(function () {
    app = koa();
  });

  it('should pass in argument', function () {
    (function() {app.use(koaProxy())}).should.throw('Options Object Required');
  });

  it('should pass in pure object', function () {
    (function() {app.use(koaProxy([]))}).should.throw('Options Object Required');
  });

  afterEach(function () {
    app = null;
  });
});

describe('koa proxy', function () {
  var target, app, request;

  before(function () {
   target = backServer.listen(1337);
  });

  before(function() {
    app = koa();

    app.use(koaProxy({
      map: {
        '/proxy': 'http://127.0.0.1:1337',
        '=/nodejs': 'http://127.0.0.1:1337',
        '~^story': 'http://127.0.0.1:1337',
        '~*story': 'http://127.0.0.1:1337',
        '/slash': 'http://127.0.0.1:1337/',
        '/transform': 'http://127.0.0.1:1337'
      },
      keepQueryString: false,
      transformResponse: function() {
        if (this.path === '/transform') {
          this.type = 'text';
          this.body = 'transformed plain text'
        }
      }
    }));

    app.use(function *() {
      this.body = 'love story!';
    });

    request = supertest(app.callback());
  });

  it('should never proxy request not map', function (done) {
    request
      .get('/love')
      .expect('love story!')
      .end(done);
  });

  it('should proxy get request', function (done) {
    request
      .get('/proxy')
      .expect('hello get!')
      .end(done);
  });

  it('should proxy post request', function (done) {
    request
      .post('/proxy')
      .expect('hello post!')
      .end(done);
  });

  it('should proxy put request', function (done) {
    request
      .put('/proxy')
      .expect('hello put!')
      .end(done);
  });

  it('should proxy delete request', function (done) {
    request
      .delete('/proxy')
      .expect('hello delete!')
      .end(done);
  });

  it('should resolve equal flag style', function (done) {
    request
      .get('/nodejs')
      .expect('hello nodejs!')
      .end(done);
  });

  it('should resolve tilde style', function (done) {
    request
      .get('/story')
      .expect('hello story lower!')
      .end(done);
  });

  it('should resolve tilde asterisk style', function (done) {
    request
      .get('/STORYLOVE')
      .expect('hello story upper!')
      .end(done);
  });

  it('should resolve slash style', function (done) {
    request
      .get('/slash')
      .expect('hello root!')
      .end(done);
  });

  it('should apply transform function to modify final response', function (done) {
    supertest('http://127.0.0.1:1337')
      .get('/transform')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect({
        "title": "love is color blind",
        "content": "transform should resolve the content"
      });
    request
      .get('/transform')
      .expect('transformed plain text')
      .end(done);
  });

  after(function () {
    target.close();
  });

});

describe('koa proxy with query string', function () {
  var target, app;

  before(function () {
    target = backServer.listen(1337);
  });

  it('should reserve query string with url when enabled', function (done) {
    app = koa();
    app.use(koaProxy({
      map: {
        '/proxy': 'http://127.0.0.1:1337/proxy'
      },
      keepQueryString: true
    }));

    supertest(app.callback())
      .get('/proxy?love=story')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect({"love":"story"})
      .end(done);
  });

  it('should remove query string with url when disabled', function (done) {
    app = koa();
    app.use(koaProxy({
      map: {
        '/proxy': 'http://127.0.0.1:1337/proxy'
      },
      keepQueryString: false
    }));

    supertest(app.callback())
      .get('/proxy?love=story')
      .expect("hello get!")
      .end(done);
  });

  after(function () {
    target.close();
  });
});

describe('koa proxy content', function () {
  var app, request;

  before(function() {
    app = koa();

    app.use(koaProxy({
      map: {},
      keepQueryString: false
    }));

    app.use(function *() {
      this.body = utils.objectNormalize(this.request.body);
    });

    request = supertest(app.callback());
  });

  it('should resolve json body', function (done) {
    request
      .post('/')
      .send({"title": "story"})
      .expect({"title":"story"})
      .end(done);
  });

  it('should resolve form body', function (done) {
    request
      .post('/')
      .send('title=story&category=education')
      .expect({"title":"story", "category":"education"})
      .end(done);
  });

  it('should resolve multipart body', function (done) {
    request
      .post('/')
      .field('title', 'koa-proxy')
      .field('content', 'kiss you')
      .attach('love', fs.createReadStream(path.join(__dirname, 'mock/love.txt')))
      .attach('youth', fs.createReadStream(path.join(__dirname, 'mock/youth.txt')))
      .expect(function(res) {
        (res.body).should.have.property('title', 'koa-proxy');
        (res.body).should.have.property('content', 'kiss you');
        (res.body).should.have.property('love', 'I love you forever!');
        (res.body).should.have.property('youth', 'youth is not a time of life!');
      })
     .end(done);
  });

  it('should transfer other body', function (done) {
    request
      .post('/')
      .expect('')
      .end(done);
  });
});

describe('koa proxy 404 error', function () {
  var target, app, request;

  before(function () {
    target = backServer.listen(1337);
  });

  before(function() {
    app = koa();

    app.use(koaProxy({
      map: {
        '/agent': 'http://127.0.0.1:1337'
      }
    }));

    request = supertest(app.callback());
  });

  it('should resolved', function (done) {
    request
      .get('/agent')
      .expect(404)
      .end(done);
  });

  after(function () {
    target.close();
  });
});