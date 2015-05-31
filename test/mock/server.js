var express =require('express');
var app = express();

app.get('/proxy/', function(req, res) {
  res.json({
    "title": "love is color blind!",
    "content": "youth is not a time of life!"
  })
});

module.exports = app;