var jsdom = require("jsdom");
var request = require("request");

var TIMETABLE_URL = "http://timetable.itcarlow.ie/";

module.exports = {

  getTimetable: function(params, cb) {
    jsdom.env({
      html: 'http://timetable.itcarlow.ie/reporting/textspreadsheet;student+set;id;KCSENB_4A%20Set%0D%0A?t=student+set+textspreadsheet&days=1-5&weeks=&periods=5-40&template=student+set+textspreadsheet',
      scripts: [],
      done: function(err, window) {
        if (err) {
          return cb(err);
        }
        return cb(null, parseTimetable(window.document));
      }
    });

  }
};


function parseTime(str) {
  var parts = str.split(":");
  return {
    hours: parseInt(parts[0], 10),
    mins: parseInt(parts[1], 10)
  };
}

// A mapping of the content of an element to it's position
// in the DOM element. Also defines an optional parse function
// if the content can be better represented in a format other
// than a string.
var LAYOUT = [
  {
    name: "name"
  },
  {
    name: "module"
  },
  {
    name: "type"
  },
  {
    name: "start",
    parse: parseTime
  },
  {
    name: "end",
    parse: parseTime
  },
  {
    name: "duration"
  },
  {
    name: "weeks"
  },
  {
    name: "room"
  },
  {
    name: "lecturers",
    parse: function(str) {
      return str.split(";");
    }
  },
  {
    name: "groups"
  }
];

/**
* Takes a document and parses the timetable information from it.
*
* @param {Document} document A DOM document that contains a timetable
*  in the format found at timetable.itcarlow.ie. The timtable should
*  be in "list" format, as it's easier to parse and contains more
*  information on the timetable.
*/
function parseTimetable(document) {

    var dayElements = document.getElementsByTagName("p");

    var timetable = [];

    for (var i = 0, il = dayElements.length; i < il; i++) {
      var periods = [],
        dayElement = dayElements[i],
        rows = dayElement.nextSibling.nextSibling.getElementsByTagName("tr");

      for(var j = 1, jl = rows.length; j < jl; j++) {
        var columns = rows[j].children,
          period = {};

        for(var l = 0, ll = LAYOUT.length; l < ll; l++) {
          var layoutObj = LAYOUT[l],
            col = columns[l];

          // parse the contents of the element if there's a parse
          // function available. Otherwise just assume it's text.
          period[layoutObj.name] = col ?
            typeof layoutObj.parse === "function" ?
              layoutObj.parse(col.textContent) :
              col.textContent : "";
        }
        periods.push(period);
      }

      // add the day to the table and set the name as
      // the name of the day
      timetable.push({
        name: dayElement.textContent.trim(),
        periods: periods
      });
    }

    return timetable;
}



