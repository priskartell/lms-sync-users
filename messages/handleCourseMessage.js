'use strict'

const {type} = require('message-type')
const canvasApi = require('../canvasApi')
const Promise = require('bluebird')
const cl = require('../azureStorage')
const config = require('../server/init/configuration')
const log = require('../server/init/logging')
require('colors')

const csvVol = config.full.azure.csvBlobName
const msgVol = config.full.azure.msgBlobName
const csvDir = config.full.localFile.csvDir

function _createCsvFile (msg, sisCourseCode, timeStamp) {
  let header = 'course_id,user_id,role,status\n'
  let msgtype = msg._desc.userType
  let csvFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + timeStamp + '.csv'
  let msgFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + timeStamp + '.msg'
  let csvString = ''

  if (msg.member && msg.member.length > 0) {
    let csvArray = msg.member.map(user => {
      return {
        course_id: sisCourseCode,
        user_id: user,
        role: msgtype,
        status: 'active'
      }
    })
    csvArray.forEach(csvRow => {
      csvString = csvString + `${csvRow.course_id},${csvRow.user_id},${csvRow.role},${csvRow.status}
`
    })
  }

  let csvData = header + csvString
  log.info('\nGoing to open file: ' + csvFileName + ' ' + msgFileName)
  return cl.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(result => { log.info(result); return cl.cloudStoreTextToFile(msgFileName, msgVol, JSON.stringify(msg, null, 4)) })
  .then(() => cl.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => { log.info(result); return {csvContent: csvData, csvFileName: csvDir + result.name} })
  .catch(error => { log.error(error); return Promise.reject(error) })
}

function _parseKeyStudent (key) {
  // ladok2.kurser.DM.2517.registrerade_20162.1
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g
  let myArray = myRe.exec(key)
  if (myArray != null) {
    let courseInOne = 3
    let courseInTwo = 4
    let terminIn = 8
    let yearIn = 7
    let ladokIn = 9
    course = myArray[courseInOne] + myArray[courseInTwo]
    termin = myArray[terminIn] === '1' ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return sisCourseCode
  }
  return
}

function _parseKeyTeacher (key) {
   // edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
   // edu.courses.DD.DD1310.20162.1.courseresponsible
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let courseIn = 2
  let terminIn = 5
  let yearIn = 4
  let ladokIn = 6

  let myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g
  let myArray = myRe.exec(key)
  if (myArray != null) {
    course = myArray[courseIn]
    termin = myArray[terminIn] === '1' ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return sisCourseCode
  }
  return
}

function _parseKey (key, msgtype) {
  let sisCourseCode = 0
  if (msgtype === type.students) {
    sisCourseCode = _parseKeyStudent(key)
  }
  if (msgtype === type.teachers || msgtype === type.assistants || msgtype === type.courseresponsibles) {
    sisCourseCode = _parseKeyTeacher(key)
  }
  if (!sisCourseCode) {
    log.error('\nCourse code not parsable from Key. type, ' + msgtype + ' key, ' + key)
    return Promise.reject(Error('Key parse error, type, ' + msgtype + ' key, ' + key))
  }
  return Promise.resolve(sisCourseCode)
}

function _process (msg) {
  let sisCourseCode = ''
  let timeStamp = Date.now()

  return _parseKey(msg.ug1Name, msg._desc.userType)
    .then(sisCode => {
      sisCourseCode = sisCode
      log.info(`In _process ${sisCourseCode}, processing for ${msg._desc.userType}`)
      return canvasApi.findCourse(sisCourseCode)
    })
    .then(result => {
      log.info(`Result from find course: ${result}`)
      return _createCsvFile(msg, sisCourseCode, timeStamp)
    })
    .then(csvObject => {
      log.info('FileName: ', csvObject.csvFileName)
      return csvObject.csvFileName
    })
    .then(fileName => canvasApi.sendCsvFile(fileName))
    .then(canvasReturnValue => {
      let documentId = sisCourseCode + '.' + timeStamp
      let document = {id: documentId, msg: msg, resp: canvasReturnValue}
      log.info(document)
      return
    })
    .catch(err => {
      if (err.statusCode === 404) {
        log.info('Course does not exist in canvas, skipping, '.red + sisCourseCode.red)
        return Promise.resolve('Course does not exist in canvas')
      } else {
        return Promise.reject(Error(err))
      }
    })
}

module.exports = function (msg, counter) {
  log.info('Processing for msg..... ' + msg.ug1Name)
  var msgtype = msg._desc.userType
  if (msg._desc && (msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants || msgtype === type.courseresponsibles)) {
    return _process(msg)
  } else {
    log.error('This is something else than students, teacher, assistant, courseresponsibles we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
    return Promise.resolve('Unknown flag: ' + msgtype)
  }
}
