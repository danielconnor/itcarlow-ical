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
      staff: []
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

  var depts = [],
    deptObj = {},
    modules = [],
    moduleObj = {},
    courses = [],
    coursesObj = {},
    staff = [],
    staffObj = [];

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
  }

  console.log("var depts = " + JSON.stringify(deptObj) + ";");
});
