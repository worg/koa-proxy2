var path = require('path');
var express =require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.send('hello root!');
});

app.get('/proxy', function(req, res) {
  if (Object.keys(req.query).length !==0) return res.json(req.query);
  res.send('hello get!');
});

app.get('/nodejs', function(req, res) {
  res.send('hello nodejs!');
});

app.get('/story', function(req, res) {
  res.send('hello story lower!');
});

app.get('/STORYLOVE', function(req, res) {
  res.send('hello story upper!');
});

app.post('/proxy', function(req, res) {
  res.send('hello post!')
});

app.put('/proxy', function(req, res) {
  res.send('hello put!');
});

app.delete('/proxy', function(req, res) {
  res.send('hello delete!');
});

var  serialize = function(obj) {
  if (!obj.constructor || !(Object == obj.constructor)) return '';
  var result = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
    }
  }
  return result.join('&');
};

app.post('/content', function(req, res) {
  if (Object.keys(req.body).length === 0) return res.send(new Buffer(0));
  if (req.is('application/x-www-form-urlencoded')) return res.send(serialize(req.body));
  if (req.is('json')) return res.send(req.body);
});

module.exports = app;