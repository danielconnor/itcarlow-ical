var jsdom = require("jsdom");
var ical = require("./ical");
var util = require("util");

/**
* Get the timetable html representation and create a DOM
* structure from it to allow it to be parsed using the
* DOM javascript API
*
* @param {String} url The location of the timetable
* @param {Function} cb A callback function for when the
*  document has been created.
*/
function getTimetable(url, cb) {

  url = url.replace(/individual/g, "textspreadsheet");

  jsdom.env({
    html: url,
    scripts: [],
    done: function(err, window) {
      if (err) {
        return cb(err);
      }
      return cb(null, parseTimetable(window.document, url));
    }
  });
}

/**
* Quick reference to the days and their values
* according to the Date object.
*/
var DAYS = {
  "sunday": 0,
  "monday": 1,
  "tuesday": 2,
  "wednesday": 3,
  "thursday": 4,
  "friday": 5,
  "saturday": 6
};
var DAYS_SHORTHAND = [
  "SU",
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA"
];

/**
* Convert a string in the form "hh:mm" to an object
* representation
*/
function parseTime(str) {
  var parts = str.split(":");
  return {
    hours: parseInt(parts[0], 10),
    mins: parseInt(parts[1], 10)
  };
}

/**
* Split a list delimted by a ";"
*/
function parseList(str) {
  return str.split(";");
}

function pad(num) {
  return num < 10 ? "0" + num : "" + num;
}


/**
* @param {String} name The name of the day i.e. Monday, Tuesday...
*/
function Day(name) {
  this.name = name;
  this.periods = [];
}
Day.prototype.addPeriod = function(period) {
  this.periods.push(period);
};


/**
* Create a timetable data structure
* that manages multiple days. It can
* also be converted to an iCal Calendar
*
* @param {String} url The url that the timetable was fetched from
*/
function Timetable(url, name) {
  this.url = url || "";
  this.days = [];
}

/**
* Push a Day object to the internal days array
*
* @param {ical.Day} day The day to add to the timetable
*/
Timetable.prototype.addDay = function(day) {
  this.days.push(day);
};

/**
* Extends the Date object to return a
* date string in iCal format
*
* @returns {String} in the format yyyymmdd'T'hhmmss
*/
Date.prototype.toICAL = function() {
  return this.getFullYear() +
    pad(this.getMonth() + 1) +
    pad(this.getDate()) +
    "T" +
    pad(this.getHours()) +
    pad(this.getMinutes()) +
    pad(this.getSeconds());
};

/**
* Creates an iCal Calendar data structure from itself.
*
* @returns {ical.Canendar}
*/
Timetable.prototype.toICAL = function() {
  var days = this.days,
    now = new Date(),
    today = now.getDay(),
    calendar = new ical.Calendar();

  calendar.setTimezone("Europe/Dublin");

  for(var i = 0, il = days.length; i < il; i++) {

    var day = days[i],
      periods = day.periods,
      dayVal = DAYS[day.name.toLowerCase()],
      dateTime = new Date();

    // set the date of the timetable day to be relative to the
    // current day so the dates are for this week
    dateTime.setDate(dateTime.getDate() - (today - dayVal));

    // no need for setting seconds
    dateTime.setSeconds(0);

    for(var j = 0, jl = periods.length; j < jl; j++) {
      var period = periods[j],
        event = new ical.Event();

      // set some attributes for each period
      // reuse the date object and update just the times
      dateTime.setHours(period.start.hours);
      dateTime.setMinutes(period.start.mins);

      event.setAttribute("DTSTART;TZID=Europe/Dublin", dateTime.toICAL());

      dateTime.setHours(period.end.hours);
      dateTime.setMinutes(period.end.mins);

      event.setAttribute("DTEND;TZID=Europe/Dublin", dateTime.toICAL());
      event.setAttribute("SUMMARY", period.name);
      event.setAttribute("DESCRIPTION", period.lecturers.join(";"));
      event.setAttribute("LOCATION", period.room);
      event.setAttribute("RRULE", "FREQ=WEEKLY");
      event.setAttribute("SEQUENCE", "1");

      calendar.add(event);
    }

  }

  return calendar;
};

// A mapping of the content of an element to it's position
// in the DOM element. Also defines an optional parse function
// if the content can be better represented in a format other
// than a string.
var LAYOUT = {
  "activity": {
    name: "name"
  },
  "module": {
    name: "module"
  },
  "type": {
    name: "type"
  },
  "start": {
    name: "start",
    parse: parseTime
  },
  "end": {
    name: "end",
    parse: parseTime
  },
  "duration": {
    name: "duration"
  },
  "weeks": {
    name: "weeks"
  },
  "room": {
    name: "room"
  },
  "staff": {
    name: "lecturers",
    parse: parseList
  },
  "student groups": {
    name: "groups",
    parse: parseList
  }
};


/**
* Takes a document and parses the timetable information from it.
*
* @param {Document} document A DOM document that contains a timetable
*  in the format found at timetable.itcarlow.ie. The timtable should
*  be in "list" format, as it's easier to parse and contains more
*  information on the timetable.
*/
function parseTimetable(document, url) {

    // day elements contain the name of the days
    var dayElements = document.getElementsByTagName("p"),
      timetable = new Timetable(url);

    if(!dayElements.length) return timetable;

    // the layout will sometimes differ from staff to student
    // so the order of the columns must be generated on the fly.
    var layout = [],
      columns = dayElements[0].nextSibling;

    // day elements are followed by the table containing
    // the timetable for the day specified in the "dayElement"
    // follow each sibling until you find it.
    while(columns && columns.tagName !== "TABLE") {
      columns = columns.nextSibling;
    }

    // if we haven't found a table
    // return an emtpy timetable
    if(!columns) return timetable;

    columns = columns.getElementsByTagName("tr")[0].children;


    for(var c = 0, cl = columns.length; c < cl; c++) {
      layout.push(LAYOUT[columns[c].textContent.toLowerCase()]);
    }

    for (var i = 0, il = dayElements.length; i < il; i++) {
      var dayElement = dayElements[i],
        day = new Day(dayElement.textContent.trim()),
        rows = dayElement.nextSibling.nextSibling.getElementsByTagName("tr");

      for(var j = 1, jl = rows.length; j < jl; j++) {
        var columns = rows[j].children,
          period = {};

        for(var l = 0, ll = layout.length; l < ll; l++) {
          var layoutObj = layout[l],
            col = columns[l];

          // parse the contents of the element if there's a parse
          // function available. Otherwise just assume it's text.
          period[layoutObj.name] = col ?
            typeof layoutObj.parse === "function" ?
              layoutObj.parse(col.textContent) :
              col.textContent : "";
        }
        day.addPeriod(period);
      }

      // add the day to the table and set the name as
      // the name of the day
      timetable.addDay(day);
    }

    return timetable;
}

module.exports.Day = Day;
module.exports.Timetable = Timetable;
module.exports.getTimetable = getTimetable;