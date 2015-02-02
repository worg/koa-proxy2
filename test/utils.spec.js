var should = require('should');
var utils = require('../utils/utils.js');
var koa = require('koa');
var koaBody = require('koa-body');
var path = require('path');
var supertest = require('supertest');
var resolvePath = utils.resolvePath;
var fs = require('fs');

describe('resolvePath function', function () {
  var map;

  before(function () {
    map = {
      '/love': 'http://localhost',
      '=/nodejs': 'http://localhost',
      '~/story': 'http://localhost',
      '~*/article': 'http://localhost',
      '/swift': 'http://localhost/'
    };
  });

  it('should resolve normal style', function () {
    var path1 = '/love';
    var path2 = '/loves';
    var result1 = resolvePath(path1, map);
    var result2 = resolvePath(path2, map);
    result1.should.equal('http://localhost/love');
    result2.should.be.false;
  });

  it('should resolve equal sign style', function () {
    var path1 = '/nodejs';
    var path2 = '/nodejs/';
    var result1 = resolvePath(path1, map);
    var result2 = resolvePath(path2, map);
    result1.should.equal('http://localhost/nodejs');
    result2.should.be.false;
  });

  it('should resolve tilde style', function () {
    var path1 = '/story-is-colorful';
    var path2 = '/Story-is-colorful';
    var result1 = resolvePath(path1, map);
    var result2 = resolvePath(path2, map);
    result1.should.equal('http://localhost/story-is-colorful');
    result2.should.be.false;
  });

  it('should resolve tilde asterisk style', function () {
    var path1 = '/article-is-colorful';
    var path2 = '/ARTICLE-is-colorful';
    var result1 = resolvePath(path1, map);
    var result2 = resolvePath(path2, map);
    result1.should.equal('http://localhost/article-is-colorful');
    result2.should.equal('http://localhost/ARTICLE-is-colorful');
  });

  it('should resolve given slash style', function () {
    var path1 = '/swift';
    var result1 = resolvePath(path1, map);
    result1.should.equal('http://localhost/');
  });

  after(function () {
    map = null;
  });
});

describe('utils resolve body', function () {
  var app, request;
  beforeEach(function () {
    app = koa();
    app.use(koaBody());
    app.use(function *() {
      this.body = utils.resolveBody(this.request);
    })
  });

  beforeEach(function () {
    request = supertest(app.callback());
  });

  it('should resolve false related body', function (done) {
    request
      .post('/')
      .expect('')
      .end(done);
  });

  it('should resolve json body', function (done) {
    request
      .post('/')
      .send({title: 'story'})
      .expect({"title":"story"})
      .end(done);
  });

  it('should resolve form body', function (done) {
    request
      .post('/')
      .send('title=story&category=education')
      .expect('title=story&category=education')
      .end(done);
  });
});

describe('utils resolve multipart', function () {
  var app, request;
  beforeEach(function () {
    app = koa();
    app.use(function *() {
      if (this.path === '/explicit') this.body = yield utils.resolveMultipart(this.req);
      if (this.path === '/implicit') this.body = yield utils.resolveMultipart(this);
    })
  });

  beforeEach(function () {
    request = supertest(app.callback());
  });

  it('should resolve fields part explicit', function (done) {
    request
      .post('/explicit')
      .field('title', 'love')
      .field('author', 'bornkiller')
      .expect({"title" : "love", "author" : "bornkiller"})
      .end(done);
  });

  it('should resolve fields part implicit', function (done) {
    request
      .post('/implicit')
      .field('title', 'love')
      .field('author', 'bornkiller')
      .expect({"title" : "love", "author" : "bornkiller"})
      .end(done);
  });
});

describe('utils resolve multipart', function () {
  var app, request, stream;
  beforeEach(function () {
    app = koa();
    app.use(function *() {
      stream = yield utils.resolveMultipart(this.req);
      this.body = stream.love;
    })
  });

  beforeEach(function () {
    request = supertest(app.callback());
  });

  it('should resolve file part', function (done) {
    request
      .post('/')
      .attach('love', path.join(__dirname, './mock/love.txt'), 'love.txt')
      .expect(function(res) {
        (res.text).should.equal('I love you forever!')
      })
      .end(done);
  });
});

describe('utils methods', function () {
  it('serialize method should resolve object', function () {
    var origin = {
      "title": "story",
      "category": "education"
    };
    var result = utils.serialize(origin);
    result.should.equal('title=story&category=education');
  });

  it('serialize method should never resolve non-object', function() {
    var compare = ["hello"];
    var result = utils.serialize(compare);
    result.should.equal('');
  });

  it('objectNormalize method should transform multipart object', function () {
    var content = {
      title: 'kiss you',
      love: fs.readFileSync(path.join(__dirname, 'mock/love.txt')),
    };
    var result = utils.objectNormalize(content);
    result.should.have.properties({
      title: 'kiss you',
      love: 'I love you forever!'
    });
  });

  it('objectNormalize method should handle other variables', function () {
    utils.objectNormalize('').should.equal('');
  });
});