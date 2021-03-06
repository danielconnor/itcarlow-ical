(function() {

  function inherits(ctor, superCtor) {
      var child = function() {};

      child.prototype = superCtor.prototype;
      ctor.super_ = superCtor;
      ctor.prototype = new child();
      ctor.prototype.constructor = ctor;
  }


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
      "CALSCALE": "GREGORIAN"
    });
  }
  inherits(Calendar, iCal);

  function Event() {
    iCal.call(this, "VEVENT");
  }
  inherits(Event, iCal);


  var DAYS = {
    "sunday": 0,
    "monday": 1,
    "tuesday": 2,
    "wednesday": 3,
    "thursday": 4,
    "friday": 5,
    "saturday": 6
  };


  function parseTime(str) {
    var parts = str.split(":");
    return {
      hours: parseInt(parts[0], 10),
      mins: parseInt(parts[1], 10)
    };
  }
  function parseList(str) {
    return str.split(";");
  }

  function pad(num) {
    return num < 10 ? "0" + num : num;
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
      parse: parseList
    },
    {
      name: "groups",
      parse: parseList
    }
  ];

  function Day(name, periods) {
    this.name = name;
    this.periods = periods || [];
  }
  Day.prototype.addPeriod = function(period) {
    this.periods.push(period);
  };

  function Timetable(url) {
    this.url = url || "";
    this.days = [];
  }

  Timetable.prototype.addDay = function(day) {
    this.days.push(day);
  };

  Date.prototype.toICAL = function() {
    return this.getFullYear() +
      pad(this.getMonth() + 1) +
      pad(this.getDate()) +
      "T" +
      pad(this.getHours()) +
      pad(this.getMinutes()) +
      pad(this.getSeconds());
  };

  Timetable.prototype.toICAL = function() {
    var days = this.days,
      now = new Date(),
      today = now.getDay(),
      calendar = new Calendar();

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
          event = new Event();

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

    return calendar;
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

      var dayElements = document.getElementsByTagName("p");

      var timetable = new Timetable(url);

      for (var i = 0, il = dayElements.length; i < il; i++) {
        var dayElement = dayElements[i],
          day = new Day(dayElement.textContent.trim()),
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
          day.addPeriod(period);
        }

        // add the day to the table and set the name as
        // the name of the day
        timetable.addDay(day);
      }

      return timetable;
  }


  (function() {
    var url = document.location.href,
      spreadsheetUrl = url.replace(/individual/g, "textspreadsheet");

    function loadICS(document) {
      var timetable = parseTimetable(document, spreadsheetUrl),
        uri = "data:text/calendar," + encodeURIComponent(timetable.toICAL().toString());

      document.location.href = uri;
    }

    // we have to be on the spreadsheet format page for the
    // parser to work
    if(url === spreadsheetUrl) {
      loadICS(window.document);
    }
    // if the url isn't correct, load it in an iframe and
    // parse the resulting document
    else {
      var iframe = document.createElement("iframe");

      iframe.onload = function() {
        loadICS(iframe.contentDocument || iframe.contentWindow.document);
      };
      // the iframe must be appended to the body
      // for it to load, so we hide it using css
      iframe.style.display = "none";
      iframe.src = spreadsheetUrl;
      document.body.appendChild(iframe);
    }


  })();


})();