var util = require("util");
var timetable = require("./lib/timetable.js");
var ical = require("./lib/ical.js");
var request = require("request");
var express = require("express");

var app = express();



request("http://timetable.itcarlow.ie/js/filter.js", function(err, res, body) {
  var regex = /(\w+)array\[(\d+)\] \[(\d+)\] = \"(.+?)\"/g,
    match;

  function next() {
    return regex.exec(body);
  }
  var depts = [],
    deptObj = {},
    modules = [],
    moduleObj = {},
    courses = [];

  while((match = next()) !== null) {
    var type = match[1],
      index = match[2],
      item = match[3];


    switch(type) {
      case "module":
        var name = match[4],
          dept = next()[4],
          id = next()[4],
          module = {
            name: name,
            dept: dept,
            id: id
          };

        moduleObj[id] = module;
        modules.push(module);

        break;
      case "staff":
        break;
      case "zone":
        break;
      case "dept":
        var name = match[4],
          id = next()[4];

        deptObj[id] = name;
        depts.push({
          name: name,
          id: id,
          modules: []
        });

        break;
      case "studset":
        var name = match[4],
          dept = next()[4],
          id = next()[4],
          course = {
            name: name,
            dept: dept,
            id: id
          };
        courses.push(course);

        break;
      case "room":
        break;
      case "roombydept":
        break;
      case "prog":
        break;
      default:
        console.log(type);
        break;
    }

  }
  // console.log(courses);
});


app.configure(function () {

    app.set('views', __dirname + '/views');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
      store: sessionStore,
      secret: 'secret',
      key: 'express.sid'
    }));


    app.use(express.methodOverride());
    app.use(express.static(__dirname + '/static'));
});



app.get("/timetable.:format", function(req, res) {

  timetable.getTimetable("KCSENB_4A%20Set%0D%0A", function(err, timetable) {

    switch(req.params.format) {
      case "json":

        res.json(timetable);
        break;
      case "ics":
      case "ical":
      default:
        res.set('Content-Type', 'text/calendar');
        res.send(timetable.toICAL().toString());
        break;
    }

  });

});

app.listen(80);