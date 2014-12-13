var path = require('path');
var express =require('express');

var app = express();

app.get('/proxy', function(req, res) {
  if (Object.keys(req.query).length !==0) return res.json(req.query);
  res.send('hello get!');
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