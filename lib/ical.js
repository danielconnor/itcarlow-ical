var util = require("util");

function iCal(type, defaultAttrs) {
  this.type = type;
  this.attributes = defaultAttrs || {};
  this.people = [];
  this.children = [];
}

iCal.prototype.setAttribute = function(key, val) {
  this.attributes[key] = val;
};

iCal.prototype.add = function(child) {
  if(child instanceof iCal) {
    this.children.push(child);
  }
};

iCal.prototype.toString = function() {
  var body = "",
    attrs = this.attributes,
    attrNames = Object.keys(attrs),
    children = this.children;

  for(var i = 0, il = attrNames.length; i < il; i++) {
    var attrName = attrNames[i],
      attr = attrs[attrName];
    if(typeof attr !== "string" && attr.length !== undefined) {
      // TODO: Add logic for things like the "ATTENDEE" attribute
    }
    else {
      body += attrName.toUpperCase() + ":" + attrs[attrName] + "\n";
    }
  }

  for(i = 0, il = children.length; i < il; i++) {
    body += children[i];
  }

  return "BEGIN:" + this.type.toUpperCase() + "\n" +
          body +
         "END:" + this.type.toUpperCase() + "\n";
};

function Calendar() {
  iCal.call(this, "VCALENDAR", {
    "VERSION": "2.0",
    "CALSCALE": "GREGORIAN",
    "PRODID":"-//Google Inc//Google Calendar 70.9054//EN"
  });
}
util.inherits(Calendar, iCal);

function Event() {
  iCal.call(this, "VEVENT");
}
util.inherits(Event, iCal);

module.exports.Calendar = Calendar;
module.exports.Event = Event;
