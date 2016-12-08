'use strict'

const {type} = require('message-type')
const canvasApi = require('../canvasApi')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
require('colors')
const log = require('../server/init/logging')
const {createLine} = require('../csvFile')

const fileHeaders = ['course_id', 'user_id', 'role', 'status']

function _createCsvFile (msg, sisCourseCode) {
  const d = Date.now()
  const msgtype = msg._desc.userType
  const fileName = `enrollments.${msgtype}.${sisCourseCode}.${d}`

  const csvFileName = './CSV/' + fileName + '.csv'
  const msgFileName = './MSG/' + fileName + '.msg'

  const csvLines = msg.member.map(userId => createLine('sisCourseCode', userId, msgtype, 'active'))
  const csvData = createLine(fileHeaders) + csvLines.join()

  log.info('Going to open file: ', csvFileName, msgFileName)

  return fs.writeFileAsync(csvFileName, csvData, {}) // we are in a promise chain, if error thrown it shoud be cateched in error handling funciton
    .then(() => fs.writeFileAsync(msgFileName, msg, {}))
    .then(() => { return {csvContent: csvData, csvFileName: csvFileName} })
}

function handleMessage (msg) {
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let sisCourseCode = null
  let myRe = null
  let myArray = []
  let msgtype = msg._desc.userType

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
      return Promise.resolve('Key parse error, Student')
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
    } else { // failed to parse course
      console.warn('\nCourse code not parsable from ug1Name structure: ' + msg.ug1Name)
      return Promise.resolve('Key parse error, Teacher or Assistant')
    }
  }

  console.info(`
In handleMessage ${sisCourseCode}, processing for ${msgtype}`)

  return canvasApi.findCourse(sisCourseCode)
    .catch(e => {
      if (e.statusCode === 404) {
        // course not found in canvas. This is ok, just skip it
      } else {
        throw e
      }
    })
    .then(() => _createCsvFile(msg, sisCourseCode))
    .then(csvObject => {
      console.log(csvObject.csvContent)
      return csvObject.csvFileName
    })
    .then(fileName => canvasApi.sendCsvFile(fileName))
    .then(canvasReturnValue => {
      log.info('csv file sent to canvas', canvasReturnValue)
      return msg
    })
}

module.exports = function (msg) {
  log.info('\nProcessing for msg..... ' + msg.ug1Name)

  if(!msg.member || !msg._desc){
    log.warn('incorrect message', msg)
    return Promise.resolve(msg)
  }

  var msgtype = msg._desc.userType

  if (msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants) {
    return handleMessage(msg)
  } else {
    log.info('\nThis is something else than students, teacher, assistant, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
    return Promise.resolve(msg)
  }
}
