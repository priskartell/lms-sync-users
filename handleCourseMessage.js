const {type} = require('message-type')
const config = require('./server/init/configuration')
const canvasApi = require('./canvasApi')(config.safe.canvas.apiUrl, config.secure.canvas.apiKey)
var Promise = require('bluebird');
// var testCourseArrayPeriod2 = require('./courseList')
const fs = Promise.promisifyAll(require('fs'));
const colors = require('colors')
var ROOTACCOUNT = null
// var _courses = {}
var _canvasCourses = {}
var _stat = {}

canvasApi.listCourses ()
    .then(courselist => courselist.map(item=>_canvasCourses[item.sis_course_id] = true))
.then(()=>console.log(_canvasCourses))

//testCourseArrayPeriod2.forEach(c=> {_courses[c.courseCode] = true; _stat[c.courseCode] = 0})
//console.info(_courses)


function _courseCode(ug1Name,msgtype) {


  var sisCourseCode = null
  var course = null
  var termin = null
  var year = null
  var ladok = null
  var sisCourseCode = null
  var myRe = null
  var myArray = []

  if (msgtype === type.students) { // ladok2.kurser.DM.2517.registrerade_20162.1
     myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g;
     myArray = myRe.exec(ug1Name);
    if (myArray != null) {
       course = myArray[3] + myArray[4]
       termin = myArray[8] === 1 ? "HT" : "VT"
       year = myArray[7]
       ladok = myArray[9]
       sisCourseCode = course + termin + year + ladok
    } else { // failed to parse course
      console.warn("\nCourse code not parsable from ug1Name structure: " + ug1Name)
      return -1
    }
  }
  if (msgtype === type.teachers || msgtype === type.assistants ) {// edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
     myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g
    myArray = myRe.exec(ug1Name);
    if (myArray != null) {
      course = myArray[2]
      termin = myArray[5] === 1 ? "HT" : "VT"
      year = myArray[4]
      ladok = myArray[6]
      sisCourseCode = course + termin + year + ladok
    }
      else { // failed to parse course
      console.warn("\nCourse code not parsable from ug1Name structure: " + ug1Name)
      return -1
    }
  }


  if (_canvasCourses[sisCourseCode] != true) {
    // Course not in canvas
    console.warn("\nCourse code not in the selected course list: " + sisCourseCode )
    return -2
  }
  if (_stat[sisCourseCode] === undefined)
    _stat[sisCourseCode] = 0
  _stat[sisCourseCode] += 1
  return sisCourseCode  // returning course code in accordance to canvas sis

}

function _processMessage(msg,csvfile,msgfile) {
  var header = "course_id,user_id,role,status\n"
  var csvString = ""
  msg.member.map(user => csvString +=  `${course},${user},${msgtype}, active\n`)
  var data = header + csvString

  console.info(data)
  console.info("\nGoing to open file: " + csvfile + " " + msgfile);
  return fs.writeFileAsync(csvfile, data, {})
.then(()=> fs.writeFileAsync(msgfile, JSON.stringify(msg, null, 4), {}))
.then(()=> canvasApi.sendCreatedUsersCsv(csvfile))
.then(canvasReturnValue=>console.log(canvasReturnValue,null,4))
}



  module.exports = function (msg) {
  if (_canvasCourses === {}) {
    console.info("\nWaiting for canvasApi to return list of courses......")
    return process.nextTick(this(msg))
  }

    else {
    console.info("\nProcessing for msg..... " + msg.ug1Name)

    var msgtype = msg._desc.userType

    if (msg._desc && ( msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants)) {

      var course = _courseCode(msg.ug1Name, msgtype)

      switch (course) {
        case -1:
          console.warn("\nSkipping " + msg.ug1Name + " " + msgtype + " Parse error")
          return msg
        case -2:
          console.warn("\nSkipping " + msg.ug1Name + " " + msgtype + " Unselected course")
          return msg
        default:
        {
          console.info(`in
          handleCourseMessage
          for ${course},
          processing
          for ${msgtype}`
        )
          var d = Date.now()
          var csvfileName = "./CSV/" + "enrollments_" + msgtype + "_" + course + "_" + d + ".csv"
          var msgfileName = "./MSG/" + "msg_" + msgtype + "_" + course + "." + d
          return _processMessage(msg, csvfileName, msgfileName)
        }
      }
    }
    else {
      console.warn('\nthis is something else than students, teacher, assistant, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
      return Promise.resolve("Skipping......")
    }
  }
}
