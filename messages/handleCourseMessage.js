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

  log.info('Number of users recived from canvas: ' + enrollmentsArray.length)
  log.info('Number of users recieved from message: ' + msg.member.length)

  if (msg.member && msg.member.length > 0) {
    msgUsers = new Set(msg.member)
  }
  canvasUserArray = enrollmentsArray.map(canvasUser => canvasUser.sis_user_id)

  canvasUserArray.forEach(item => log.info('Debug canvas userid: ' + item))
  msg.member.forEach(item => log.info('debug msg userid: ' + item))

  if (canvasUserArray && canvasUserArray.length > 0) {
    canvasUsers = new Set(canvasUserArray)
  }
  let activateSet = new Set([...msgUsers].filter(user => !canvasUsers.has(user)))
  let deactivateSet = new Set([...canvasUsers].filter(user => !msgUsers.has(user)))
  let counter = 0
  csvArray = [...activateSet].map(user => {
    counter += 1
    log.info('[' + counter + '] ' + 'User: ' + user + ' will be enrolled to course: ' + sisCourseCode)
    return {
      course_id: sisCourseCode,
      user_id: user,
      role: msgtype,
      status: 'active'
    }
  })
  counter = 0
  csvDarray = [...deactivateSet].map(user => {
    counter += 1
    log.info('[' + counter + '] ' + 'User: ' + user + ' should be unrolled from course ' + sisCourseCode + ' ,no action taken for now: ')
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

  if (csvString === '') {
    csvFileName = csvFileName + '.EMPTY'
  }

  return cl.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(result => { log.info(result); return cl.cloudStoreTextToFile(msgFileName, msgVol, JSON.stringify(msg, null, 4)) })
  .then(() => cl.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => { log.info(result); let fileName = csvDir + result.name; return fileName })
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
      return Promise.reject(Error('_getEnrollmentsForCourse, Invalid message type: ' + msgtype))
  }
  return canvasApi.getEnrollmentList(canvasCourseId, enrollType)
}

function _sendCsvIfNotEmpty (fileName) {
  if (fileName.split('.')[6] === 'EMPTY') {
    log.info('CSV file is empty, will not be sent to canvas, skipping....')
    return
  } else {
    return canvasApi.sendCsvFile(fileName)
  }
}

function _followUpTicket (csvTicket) {
  if (!csvTicket) {
    return // No file was sent to canvas, file empty
  }
  let Result = JSON.parse(csvTicket)
  log.debug(csvTicket)
  return canvasApi.getCsvFileStatus(Result.id)
}

function _generateReport (csvReport, sisCourseCode, timeStamp, document) {
    setTimeout(_createReport.bind(null, csvReport, sisCourseCode, timeStamp, document), 120000)
  return Promise.resolve('Done')
}

function _createReport (csvReport, sisCourseCode, timeStamp, document) {
  let documentId = sisCourseCode + '.' + timeStamp
  if (!csvReport) {
    document['csvTicket'] = "Empty"
    document['csvReport'] = "Empty"
  }
  else {
  let tmp = JSON.parse(document.csvTicket)
  document['csvTicket'] = tmp
  document['csvReport'] = JSON.parse(csvReport)
  }
  document['id'] = documentId
  console.info(JSON.stringify(document, null, 4))
  let collectionUrl = `dbs/${lmsDatabase}/colls/${lmsCollection}`
  return cl.cloudCreateDocument(document, collectionUrl)
}

function _handleError (err, sisCourseCode) {
  if (err.statusCode === 404) {
    log.info('Course does not exist in canvas, skipping, '.red + sisCourseCode.red)
    return Promise.resolve('Course does not exist in canvas')
  } else {
    return Promise.reject(Error(err))
  }
}

function _process (msg) {
  let sisCourseCode = ''
  let timeStamp = Date.now()
  let msgtype = msg._desc.userType
  let key = msg.ug1Name
  let document = {}

  return _parseKey(key, msgtype)
    .then(sisCode => {
      sisCourseCode = sisCode
      log.info(`In _process ${sisCourseCode}, processing for ${msgtype}`)
      document['sisCourseCode'] = sisCourseCode
      return canvasApi.findCourse(sisCourseCode)
    })
    .then(result => {
      let Result = JSON.parse(result)
      document['canvasCourse'] = result
      return _getEnrollmentsForCourse(Result.id, msgtype)
    })
    .then(enrollmentsArray => {
      document['usersInCanvas'] = enrollmentsArray.map(canvasUser => canvasUser.sis_user_id)
      document['usersInmsg'] = msg.member
      return _createCsvFile(msg, sisCourseCode, enrollmentsArray, timeStamp)
    })
    .then(fileName => { document['fileName'] = fileName; return _sendCsvIfNotEmpty(fileName) })
    .then(csvTicket =>{ document['csvTicket'] = csvTicket; return _followUpTicket(csvTicket)})
    .then(csvReport => _generateReport(csvReport, sisCourseCode, timeStamp, document))
    .catch(err => _handleError(err, sisCourseCode))
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
