var util = require("util");
var timetable = require("./lib/timetable.js");
var ical = require("./lib/ical.js");
var request = require("request");
var express = require("express");
var connect = require("connect");

var app = express();

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(connect.compress());
    app.use(express.static(__dirname + '/static'));
});


app.get("/timetable.:format", function(req, res) {
  var query = req.query,
    url;
  if(query.url) {
    url = query.url;
  }
  else if(query.type && query.item) {
    var type = query.type === "staff" ? "staff" : "student+set";
    url = "http://timetable.itcarlow.ie/reporting/textspreadsheet;" + type + ";id;" + query.item + "?days=1-5&periods=5-40&template=" + type + "+textspreadsheet";
  }
  else {
    return res.send("oops");
  }

  timetable.getTimetable(url, function(err, timetable) {
    if(err) {
      res.send(err);
      return;
    }

    switch(req.params.format) {
      case "json":
        res.json(timetable);
        break;
      case "ics":
      case "ical":
      default:
        res.setHeader('Content-Type', 'text/calendar');
        res.send(timetable.toICAL().toString());
        break;
    }

  });

});

app.listen(80);