var util = require("util");
var timetable = require("./lib/timetable.js");
var ical = require("./lib/ical.js");

var DAYS = {
  "sunday": 0,
  "monday": 1,
  "tuesday": 2,
  "wednesday": 3,
  "thursday": 4,
  "friday": 5,
  "saturday": 6
};

function pad(num) {
  return num < 10 ? "0" + num : num;
}

Date.prototype.toICAL = function() {
  return this.getFullYear() +
    pad(this.getMonth() + 1) +
    pad(this.getDate()) +
    "T" +
    pad(this.getHours()) +
    pad(this.getMinutes()) +
    pad(this.getSeconds());
};

timetable.getTimetable(null, function(err, timetable) {

  var now = new Date(),
    today = now.getDay(),
    calendar = new ical.Calendar();

  for(var i = 0, il = timetable.length; i < il; i++) {

    var day = timetable[i],
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

      event.setAttribute("DTSTART", dateTime.toICAL());

      dateTime.setHours(period.end.hours);
      dateTime.setMinutes(period.end.mins);

      event.setAttribute("DTEND", dateTime.toICAL());

      event.setAttribute("SUMMARY", period.name);
      event.setAttribute("DESCRIPTION", period.lecturers.join(";"));
      event.setAttribute("CREATED", now.toICAL());
      event.setAttribute("LAST-MODIFIED", now.toICAL());
      event.setAttribute("LOCATION", period.room);


      calendar.add(event);
    }

  }

  console.log(calendar.toString());

});
