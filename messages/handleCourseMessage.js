'use strict'

const {type} = require('message-type')
const canvasApi = require('../canvasApi')
const Promise = require('bluebird')
const cl = require('../azureStorage')
const config = require('../server/init/configuration')
const log = require('../server/init/logging')
require('colors')

const csvVol = config.secure.azure.csvBlobName
const msgVol = config.secure.azure.msgBlobName
const csvDir = config.secure.localFile.csvDir
const lmsDatabase = config.secure.azure.databaseName
const lmsCollection = config.secure.azure.collectionName

function _createCsvFile (msg, sisCourseCode, enrollmentsArray, timeStamp) {
  let header = 'course_id,user_id,role,status\n'
  let msgtype = msg._desc.userType
  let csvFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + timeStamp + '.csv'
  let msgFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + timeStamp + '.msg'
  let csvString = ''
  let msgUsers = new Set([])
  let canvasUsers = new Set([])
  let canvasUserArray = []
  let csvArray = []
  let csvDarray = []
  if (msg.member && msg.member.length > 0) {
    msgUsers = new Set(msg.member)
  }
  canvasUserArray = enrollmentsArray.map(canvasUser => canvasUser.sis_user_id)
  if (canvasUserArray && canvasUserArray.length > 0) {
    canvasUsers = new Set(canvasUserArray)
  }
  let activateSet = new Set([...msgUsers].filter(user => !canvasUsers.has(user)))
  let deactivateSet = new Set([...canvasUsers].filter(user => !msgUsers.has(user)))
  csvArray = [...activateSet].map(user => {
    log.info('User: ' + user + ' will be enrolled to course: ' + sisCourseCode)
    return {
      course_id: sisCourseCode,
      user_id: user,
      role: msgtype,
      status: 'active'
    }
  })
  csvDarray = [...deactivateSet].map(user => {
    log.info('User: ' + user + ' should be unrolled from course ' + sisCourseCode + ' ,no action taken for now: ')
    return {
      course_id: sisCourseCode,
      user_id: user,
      role: msgtype,
      status: 'deactivate'
    }
  })
  csvDarray = [] // Just to shut up the linter....
  log.info(csvDarray) // Just to shut up the linter....
  csvArray.forEach(csvRow => {
    csvString = csvString + `${csvRow.course_id},${csvRow.user_id},${csvRow.role},${csvRow.status}\n`
  })
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
    termin = myArray[terminIn] === 1 ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return Promise.resolve(sisCourseCode)
  }
  return Promise.reject(Error('_parseKeyStudent, ' + key + ' could not be decoded'))
}

function _parseKeyTeacher (key) {
   // edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
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
    termin = myArray[terminIn] === 1 ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return Promise.resolve(sisCourseCode)
  }
  return Promise.reject(Error('_parseKeyTeacher, ' + key + ' could not be decoded'))
}

function _parseKey (key, msgtype) {
  if (msgtype === type.students) {
    return _parseKeyStudent(key)
  }
  if (msgtype === type.teachers || msgtype === type.assistants) {
    return _parseKeyTeacher(key)
  } else {
    return Promise.reject(Error('_parseKey unkown type, ' + msgtype))
  }
}

function _getEnrollmentsForCourse (canvasCourseId, msgtype) {
  let enrollType = ''
  switch (msgtype) {
    case type.students:
      enrollType = 'StudentEnrollment'
      break
    case type.teachers:
      enrollType = 'TeacherEnrollment'
      break
    case type.assistants:
      enrollType = 'TaEnrollment'
      break
    default:
      log.warn('enrollment type not defined....')
      return Promise.reject(Error('Invalid message type: ' + msgtype))
  }
  return canvasApi.getEnrollmentList(canvasCourseId, enrollType)
}

function _process (msg) {
  let sisCourseCode = ''
  let timeStamp = Date.now()
  let msgtype = msg._desc.userType
  let key = msg.ug1Name

  return _parseKey(key, msgtype)
    .then(sisCode => {
      sisCourseCode = sisCode
      log.info(`In _process ${sisCourseCode}, processing for ${msgtype}`)
      return canvasApi.findCourse(sisCourseCode)
    })
    .then(result => {
      let Result = JSON.parse(result)
      log.info(Result)
      return _getEnrollmentsForCourse(Result.id, msgtype)
    })
    .then(enrollmentsArray => {
      log.info('Enrolled array size recived from canvas: ' + enrollmentsArray.length)
      return _createCsvFile(msg, sisCourseCode, enrollmentsArray, timeStamp)
    })
    .then(csvObject => {
      log.info('FileName: ', csvObject.csvFileName)
      return csvObject.csvFileName
    })
    .then(fileName => canvasApi.sendCsvFile(fileName))
    .then(canvasReturnValue => {
      let documentId = sisCourseCode + '.' + timeStamp
      let document = {id: documentId, msg: msg, resp: canvasReturnValue}
      let collectionUrl = `dbs/${lmsDatabase}/colls/${lmsCollection}`
      return cl.cloudCreateDocument(document, collectionUrl)
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
  log.info('\nProcessing for msg..... ' + msg.ug1Name)
  var msgtype = msg._desc.userType
  if (msg._desc && (msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants)) {
    return _process(msg)
  } else {
    log.error('\nThis is something else than students, teacher, assistant, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
    return Promise.resolve('Unknown flag: ' + msgtype)
  }
}
