var koa =require('koa');
var koaProxy = require('../index.js');
var koaBody = require('koa-body');
var should = require('should');
var supertest = require('supertest');
var backServer = require('./mock/backServer.js');

describe('koa proxy function', function () {
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
        '/slash': 'http://127.0.0.1:1337/'
      },
      keepQueryString: false
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

  after(function () {
    target.close();
  });

});

describe('koa proxy with query string', function () {
  var target, app, request;

  before(function () {
    target = backServer.listen(1337);
  });

  before(function() {
    app = koa();

    app.use(koaProxy({
      map: {
        '/proxy': 'http://127.0.0.1:1337/proxy'
      },
      keepQueryString: true
    }));

    request = supertest(app.callback());
  });

  it('should reserve query string with url', function (done) {
    request
      .get('/proxy?love=story')
      .expect('content-type', 'application/json; charset=utf-8')
      .expect({"love":"story"})
      .end(done);
  });

  after(function () {
    target.close();
  });
});

describe('koa proxy content', function () {
  var target, app, request;

  before(function () {
    target = backServer.listen(1337);
  });

  before(function() {
    app = koa();

    app.use(koaProxy({
      map: {
        '/content': 'http://127.0.0.1:1337/content'
      },
      keepQueryString: false
    }));

    request = supertest(app.callback());
  });

  it('should resolve json body', function (done) {
    request
      .post('/content')
      .send({title: 'story'})
      .expect({"title":"story"})
      .end(done);
  });

  it('should resolve form body', function (done) {
    request
      .post('/content')
      .send('title=story&category=education')
      .expect('title=story&category=education')
      .end(done);
  });

  it('should resolve null body', function (done) {
    request
      .post('/content')
      .expect(200)
      .expect('')
      .end(done);
  });

  after(function () {
    target.close();
  });
});

describe('koa proxy error', function () {
  var target, app, request;

  before(function () {
    target = backServer.listen(1337);
  });

  before(function() {
    app = koa();

    app.use(koaProxy({
      map: {
        '/proxyAgent': 'http://127.0.0.1:1337'
      },
      keepQueryString: false
    }));

    request = supertest(app.callback());
  });

  it('should resolved', function (done) {
    request
      .get('/proxyAgent')
      .expect(404)
      .end(done);
  });

  after(function () {
    target.close();
  });
});