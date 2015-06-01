var express =require('express');
var app = express();

app.get('/proxy/', function(req, res) {
  if (Object.keys(req.query).length === 0) {
    res.json({
      "title": "love is color blind!",
      "content": "youth is not a time of life!"
    })
  } else {
    res.json(req.query);
  }
});

module.exports = app;