var express =require('express');
var app = express();

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

module.exports = app;