var express =require('express');
var app = express();

app.get('/proxy', function(req, res) {
  if (Object.keys(req.query).length !==0) return res.json(req.query);
  res.send('hello get!');
});

app.get('/transform', function(req, res) {
  res.json({
    "title": "love is color blind",
    "content": "transform should resolve the content"
  })
});

module.exports = app;