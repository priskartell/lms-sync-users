'use strict'

const {type} = require('message-type')
const canvasApi = require('../canvasApi')
const Promise = require('bluebird')
const cl = require('../azureStorage')
const config = require('../server/init/configuration')
require('colors')

const csvVol = config.secure.azure.csvBlobName
const msgVol = config.secure.azure.msgBlobName
const csvDir = config.secure.localFile.csvDir
const lmsDatabase = config.secure.azure.databaseName
const lmsCollection = config.secure.azure.collectionName

function _createCsvFile (msg, sisCourseCode, millisecondDate) {
  let d = millisecondDate
  let header = 'course_id,user_id,role,status\n'
  let msgtype = msg._desc.userType
  let csvFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + d + '.csv'
  let msgFileName = 'enrollments.' + msgtype + '.' + sisCourseCode + '.' + d + '.msg'
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
  console.info('\nGoing to open file: ' + csvFileName + ' ' + msgFileName)
  let messageText = JSON.stringify(msg, null, 4)
  return cl.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(result => { console.info(result); return cl.cloudStoreTextToFile(msgFileName, msgVol, messageText) })
  .then(() => cl.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => { console.info(result); return {csvContent: csvData, csvFileName: csvDir + result.name} })
  .catch(error => { console.error(error); return Promise.reject(error) })
}

function _parseKey (key, msgtype) {
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let sisCourseCode = null
  let myRe = null
  let myArray = []

  if (msgtype === type.students) { // ladok2.kurser.DM.2517.registrerade_20162.1
    myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g
    myArray = myRe.exec(key)
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
      console.warn('\nCourse code not parsable from ug1Name structure: ' + key)
      return Promise.reject('Key parse error, Student')
    }
  }

  if (msgtype === type.teachers || msgtype === type.assistants) { // edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
    myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g
    myArray = myRe.exec(key)
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
      console.warn('\nCourse code not parsable from ug1Name structure: ' + key)
      return Promise.reject('Key parse error, Teacher or Assistant')
    }
  }
  return Promise.resolve(sisCourseCode)
}

function _process (msg) {
  let sisCourseCode = ''
  let d = Date.now()

  return _parseKey(msg.ug1Name, msg._desc.userType)
    .then(sisCode => {
      sisCourseCode = sisCode
      console.info(`In _process ${sisCourseCode}, processing for ${msg._desc.userType}`)
      return canvasApi.findCourse(sisCourseCode)
    })
    .then(() => _createCsvFile(msg, sisCourseCode, d))
    .then(csvObject => {
      console.log('FileName: ', csvObject.csvFileName)
      return csvObject.csvFileName
    })
    .then(fileName => canvasApi.sendCsvFile(fileName))
    .then(canvasReturnValue => {
      let documentId = sisCourseCode + '.' + d
      let document = {id: documentId, msg: msg, resp: canvasReturnValue}
      let collectionUrl = `dbs/${lmsDatabase}/colls/${lmsCollection}`
      return cl.cloudCreateDocument(document, collectionUrl)
    })
    .catch(err => {
      if (err.statusCode === 404) {
        console.warn('Course does not exist in canvas, skipping, '.red + sisCourseCode.red)
        return Promise.resolve('Course does not exist in canvas')
      } else {
        return Promise.reject(err)
      }
    })
}

module.exports = function (msg) {
  console.info('\nProcessing for msg..... ' + msg.ug1Name)
  var msgtype = msg._desc.userType
  if (msg._desc && (msgtype === type.students || msgtype === type.teachers || msgtype === type.assistants)) {
    return _process(msg)
  } else {
    console.warn('\nThis is something else than students, teacher, assistant, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
    return Promise.resolve('Unknown flag: ' + msgtype)
  }
}
