var path = require('path');
var fs = require('fs');
var should = require('should');
var utils = require('../utils/utils.js');

describe('utils path resolve function', function () {
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
    var result1 = utils.resolvePath(path1, map);
    var result2 = utils.resolvePath(path2, map);
    result1.should.equal('http://localhost/love');
    result2.should.be.false;
  });

  it('should resolve equal sign style', function () {
    var path1 = '/nodejs';
    var path2 = '/nodejs/';
    var result1 = utils.resolvePath(path1, map);
    var result2 = utils.resolvePath(path2, map);
    result1.should.equal('http://localhost/nodejs');
    result2.should.be.false;
  });

  it('should resolve tilde style', function () {
    var path1 = '/story-is-colorful';
    var path2 = '/Story-is-colorful';
    var result1 = utils.resolvePath(path1, map);
    var result2 = utils.resolvePath(path2, map);
    result1.should.equal('http://localhost/story-is-colorful');
    result2.should.be.false;
  });

  it('should resolve tilde asterisk style', function () {
    var path1 = '/article-is-colorful';
    var path2 = '/ARTICLE-is-colorful';
    var result1 = utils.resolvePath(path1, map);
    var result2 = utils.resolvePath(path2, map);
    result1.should.equal('http://localhost/article-is-colorful');
    result2.should.equal('http://localhost/ARTICLE-is-colorful');
  });

  it('should resolve given slash style', function () {
    var path1 = '/swift';
    var result1 = utils.resolvePath(path1, map);
    result1.should.equal('http://localhost/');
  });

  after(function () {
    map = null;
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
      love: fs.readFileSync(path.join(__dirname, 'mock/love.txt'))
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