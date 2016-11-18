const {type} = require('message-type')
const config = require('./server/init/configuration')
const canvasApi = require('canvas-api')(config.full.canvas.apiUrl, config.secure.canvas.apiKey)
console.log(JSON.stringify(config,null,4))
var Promise = require('bluebird')
// var testCourseArrayPeriod2 = require('./courseList')
const fs = Promise.promisifyAll(require('fs'))
const colors = require('colors')


function _process (msg) {
  var sisCourseCode = null
  var course = null
  var termin = null
  var year = null
  var ladok = null
  var sisCourseCode = null
  var myRe = null
  var myArray = []
  var header = 'course_id,user_id,role,status\n'
  var csvString = ''
  var data = ''
  var msgtype = msg._desc.userType
  var d = 0
  var end = 0
  var csvfileName = './CSV/' + 'enrollments_' + msgtype + '_'
  var msgfileName = './MSG/' + 'msg_' + msgtype + '_'

  if (msgtype === type.students) { // ladok2.kurser.DM.2517.registrerade_20162.1
    myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g
    myArray = myRe.exec(msg.ug1Name)
    if (myArray != null) {
      let courseInOne = 3
      let courseInTwo = 4
      let terminIn = 8
      let yearIn = 7
      let ladokIn = 9
      course = myArray[courseInOne] + myArray[courseInTwo]
      termin = myArray[terminIn] === 1 ? 'HT' : 'VT'
      year = myArray[yearIn]
      ladok = myArray[ladokIn]
      sisCourseCode = course + termin + year + ladok
    } else { // failed to parse course
      console.warn('\nCourse code not parsable from ug1Name structure: ' + msg.ug1Name)
      return Promise.resolve("Key parse error")
    }
  }

  if (msgtype === type.teachers || msgtype === type.assistants) { // edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
    myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g
    myArray = myRe.exec(msg.ug1Name)
    if (myArray != null) {
      let courseIn = 2
      let terminIn = 5
      let yearIn = 4
      let ladokIn = 6
      course = myArray[courseIn]
      termin = myArray[terminIn] === 1 ? 'HT' : 'VT'
      year = myArray[yearIn]
      ladok = myArray[ladokIn]
      sisCourseCode = course + termin + year + ladok
    }
    else { // failed to parse course
      console.warn('\nCourse code not parsable from ug1Name structure: ' + msg.ug1Name)
      return Promise.resolve("Key parse error")
    }
  }
  d = new Date()
  console.info(`\nIn _process ${sisCourseCode}, processing for ${msgtype}`)
  var csvfileName = csvfileName + sisCourseCode + '_' + d + '.csv'
  var msgfileName = msgfileName + sisCourseCode + '.' + d

  return canvasApi.getCourse(sisCourseCode)
      .then(result => {
        console.log("before")
        msg.member.map(user => csvString += `${course},${user},${msgtype}, active\n`)
        let data = header + csvString
        console.info(data)
        console.info('\nGoing to open file: ' + csvfile + ' ' + msgfile)
        return fs.writeFileAsync(csvfile, data, {})
            .then(() => fs.writeFileAsync(msgfile, JSON.stringify(msg, null, 4), {}))
  .then(() => canvasApi.sendCreatedUsersCsv(csvfile))
  .then(canvasReturnValue => console.log(canvasReturnValue, null, 4))
      })
.catch(error=>Promise.resolve("Error" + JSON.stringify(error)))
 }



module.exports = function (msg) {
  console.info('\nProcessing for msg..... ' + msg.ug1Name)
  var msgtype = msg._desc.userType
  if (msg._desc && (msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants)) {
    return _process(msg)
  }
  else {
    console.warn('\nThis is something else than students, teacher, assistant, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
    return Promise.resolve("Unknown flag")
  }
}
