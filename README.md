koa-proxy2
==========

![Build Status](https://img.shields.io/travis/bornkiller/koa-proxy2/master.svg?style=flat)
![Coverage Report](http://img.shields.io/coveralls/bornkiller/koa-proxy2.svg?style=flat)
![Package Dependency](https://david-dm.org/bornkiller/koa-proxy2.svg?style=flat)
![Package DevDependency](https://david-dm.org/bornkiller/koa-proxy2/dev-status.svg?style=flat)

Make it convenience for mock nginx trick when use angular.

## Inspiration
use angular and nginx to develop web project, it make me feel helpless when communicate with real backend API through nginx, while I only mock static server, proxy server not included. To avoid directly modify the code in the nginx server, maybe mock proxy with nodejs become necessary. 

## Usage
With time passing by, `koa-proxy2` integrate with body parser, therefore you don't have to use body parse middleware, like `koa-body` or something else, while never cause problem if you used for some reason. It only support `json`, `urlencoded`, `multipart/form-data` proxy work.

Till now, only two options provided:

```javascript
{
  map: {
    '/proxy': 'http://127.0.0.1',
	'=/nodejs': 'http://127.0.0.1',
	'~^story': 'http://127.0.0.1',
	'~*story': 'http://127.0.0.1',
	'/slash': 'http://127.0.0.1/'
  },
  keepQueryString: false
}
```

`map` the proxy rules, just like nginx style. `/proxy` is the same as `=/proxy`, `~` is regular expression match case sensitive, `~*` is almost the same as `~`, except case insensitive. when path map domain address, the final 
target URL will keep the request path, otherwise will ignore the path.

For above example:
request to `/proxy` will resolve to request to `http://127.0.0.1/proxy`;
request to `/slash` will resolve to request to `http://127.0.0.1/`, rather than `http://127.0.0.1/slash`.
`keepQueryString` to judge if reserve the query string after path.

## Practice
Assume all real backend api follow the pattern `/v1/*`, all static files are in `./static`, you will need:

```javascript
var path = require('path');
var koa = require('koa');
var serve = require('koa-static');
var koaProxy = require('koa-proxy2');
var app = koa();

app.use(koaProxy({
  map: {
    '~/v1': 'http://127.0.0.1'
  },
  keepQueryString: true
}));
app.use(serve(path.join(__dirname, 'static')));
app.use(function *() {
    this.type = 'html';
    this.body = fs.readFileSync(path.join(__dirname, 'static/index.html'), {encoding: 'utf-8'});
});
app.listen(1336);
```

## Change Log
+ 2014/12/23 v0.5.0
Add `multipart/form-data` mime type support.
+ 2014/12/21 v0.4.5
Remove `koa-body` dependency, as well as `multipart/form-data` support.
+ 2014/12/18 v0.4.0
Fix content transfer bugs.

## License

  MIT