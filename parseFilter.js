var allowedStaff = [
  "MEUDEC, CHRIS"
];


require("fs").readFile("./filter.js", function(err, data) {
  var regex = /(\w+)array\[(\d+)\] \[(\d+)\] = \"(.+?)\"/g,
    match,
    body = data.toString();

  function next() {
    return regex.exec(body);
  }

  function parseDept() {
    var name = match[4],
      id = next()[4],
      d = deptObj[id] = {
      name: name,
      id: id,
      courses: [],
      staff: [],
      rooms: []
    };
    depts.push(d);
  }

  function parseStudSet() {
    var name = match[4],
      deptID = next()[4],
      id = next()[4],
      course;

    if( (course = coursesObj[id]) ) {
      course.code = name;
    }
    else {
      var dept = deptObj[deptID];

      course = {
        name: name,
        deptID: deptID,
        id: id
      };

      if(dept) {
        dept.courses.push(course);
      }

      courses.push(course);
      coursesObj[id] = course;
    }
  }

  function parseStaff() {
    var name = match[4],
      deptID = next()[4],
      id = next()[4],
      dept = deptObj[deptID];

    // only allow staff who want to be added
    if(allowedStaff.indexOf(name) === -1) {
      return;
    }

    var staffMember = {
      name: name,
      id: id
    };

    staff.push(staffMember);
    staffObj[id] = staffMember;
    if(dept) {
      dept.staff.push(staffMember);
    }

  }

  function parseRoom() {
    var name = match[4],
      deptID = next()[4],
      id = next()[4],
      dept = deptObj[deptID];

    var room = {
      name: name,
      id: id
    };

    rooms.push(room);
    roomObj[id] = room;
    if(dept) {
      dept.rooms.push(room);
    }
  }

  var depts = [],
    deptObj = {},
    modules = [],
    moduleObj = {},
    courses = [],
    coursesObj = {},
    staff = [],
    staffObj = [],
    rooms = [],
    roomObj = {};

  while((match = next()) !== null) {
    var type = match[1],
      index = match[2],
      item = match[3];

    switch(type) {
      case "module":
        break;
      case "staff":
        parseStaff();
        break;
      case "zone":
        break;
      case "dept":
        parseDept();
        break;
      case "studset":
        parseStudSet();
        break;
      case "room":
        break;
      case "roombydept":
        parseRoom();
        break;
      case "prog":
        break;
      default:
        console.log(type);
        break;
    }
  }

  function itemSorter(a, b) {
    return a.name.localeCompare(b.name);
  }

  for(var deptID in deptObj) {
    var dept = deptObj[deptID];

    dept.staff.sort(itemSorter);
    dept.courses.sort(itemSorter);
    dept.rooms.sort(itemSorter);
  }

  console.log("var depts = " + JSON.stringify(deptObj) + ";");
});
