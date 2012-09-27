var util = require("util");

/**
* An data structure represeting a calendar and/or it's events
*
* @param {String} type The type of iCal structure i.e. VCALENDAR, VEVENT...
* @param {Object} defaultAttrs An object containing some default attributes
*  that the event will initially have.
*/
function iCal(type, defaultAttrs) {
  this.type = type;
  this.attributes = defaultAttrs || {};
  this.people = [];
  this.children = [];
}

/*
*
* @param {String} key The name of the attribute
* @param {Mixed} val The value of the attribute
*/
iCal.prototype.setAttribute = function(key, val) {
  this.attributes[key] = val;
};

/*
* Add a child to the calendar/event...
*
* @param {iCal} child The child to add.
*/
iCal.prototype.add = function(child) {
  if(child instanceof iCal) {
    this.children.push(child);
  }
};

/**
* Convert the iCal structure to a string which(mostly) conforms to the
* spec <http://tools.ietf.org/html/rfc5545>.
*
* @returns {String}
*/
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
      // which contains a list of "sub-attributes".
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

module.exports.iCal = iCal;
module.exports.Calendar = Calendar;
module.exports.Event = Event;
