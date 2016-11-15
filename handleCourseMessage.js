const {type} = require('message-type')
const config = require('./server/init/configuration')
const canvasApi = require('./canvasApi')(config.safe.canvas.apiUrl, config.secure.canvas.apiKey)
var Promise = require('bluebird');
// var testCourseArrayPeriod2 = require('./courseList')
const fs = Promise.promisifyAll(require('fs'));
const colors = require('colors')
var _processCounter = 0
var _stat = {}


function _process(msg) {

  var sisCourseCode = null
  var course = null
  var termin = null
  var year = null
  var ladok = null
  var sisCourseCode = null
  var myRe = null
  var myArray = []
  var header = "course_id,user_id,role,status\n"
  var csvString = ""
  var data = ""
  var msgtype = msg._desc.userType
  var d = 0
  var end = 0
  var csvfileName = "./CSV/" + "enrollments_" + msgtype + "_"
  var msgfileName = "./MSG/" + "msg_" + msgtype + "_"

  _processCounter += 1
  if ( _processCounter % 10 == 0 )
    console.log(_stat)

  if (msgtype === type.students) { // ladok2.kurser.DM.2517.registrerade_20162.1
     myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g;
     myArray = myRe.exec(msg.ug1Name);
    if (myArray != null) {
       course = myArray[3] + myArray[4]
       termin = myArray[8] === 1 ? "HT" : "VT"
       year = myArray[7]
       ladok = myArray[9]
       sisCourseCode = course + termin + year + ladok
    } else { // failed to parse course
      console.warn("\nCourse code not parsable from ug1Name structure: " + msg.ug1Name)
      return -1
    }
  }

   if (msgtype === type.teachers || msgtype === type.assistants ) {// edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
     myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g
    myArray = myRe.exec(msg.ug1Name);
    if (myArray != null) {
      course = myArray[2]
      termin = myArray[5] === 1 ? "HT" : "VT"
      year = myArray[4]
      ladok = myArray[6]
      sisCourseCode = course + termin + year + ladok
    }
      else { // failed to parse course
      console.warn("\nCourse code not parsable from ug1Name structure: " + msg.ug1Name)
      return -1
    }
  }


  console.info(`\nIn _process ${sisCourseCode}, processing for ${msgtype}`)
  d = Date.now()
  var csvfileName = csvfileName + sisCourseCode + "_" + d + ".csv"
  var msgfileName = msgfileName +  sisCourseCode + "." + d

  return canvasApi.getCourse(sisCourseCode)
      .then(result=>{
    msg.member.map(user => csvString +=  `${course},${user},${msgtype}, active\n`)
    var data = header + csvString
    console.info(data)
    console.info("\nGoing to open file: " + csvfile + " " + msgfile);
    _stat[sisCourseCode] = true
    return fs.writeFileAsync(csvfile, data, {})
            .then(()=> fs.writeFileAsync(msgfile, JSON.stringify(msg, null, 4), {}))
  .then(()=> canvasApi.sendCreatedUsersCsv(csvfile))
  .then(canvasReturnValue=>console.log(canvasReturnValue,null,4))
  })
  .then(()=> {  end = new Date() - d;console.info("Execution time: %dms", end);return end})
  .catch(error=>
{
  console.info("Course is not selected for Canvas....." + JSON.stringify(error,null,4))
_stat[sisCourseCode] = false
 end = new Date() - d;console.info("Execution time: %dms", end)
  return -1
})}


  module.exports = function (msg) {
    console.info("\nProcessing for msg..... " + msg.ug1Name)
    var msgtype = msg._desc.userType
    if (msg._desc && ( msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants)) {
      return _process(msg)
    }
    else {
      console.warn('\nthis is something else than students, teacher, assistant, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
      return -1
    }
  }
