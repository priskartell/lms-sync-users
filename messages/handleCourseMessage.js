 'use strict'

 const {type} = require('message-type')
 const canvasApi = require('../canvasApi')
 const Promise = require('bluebird')
 const config = require('../server/init/configuration')
 const log = require('../server/init/logging')
 const ugParser = require('./ugParser')
 const calcSisForOmregistrerade = require('./calcSisForOmregistrerade')
 require('colors')
 const createCsvFile = require('./createCsvFile')
 const csvVol = config.full.azure.csvBlobName
 const csvDir = config.full.localFile.csvDir

 function _parseKey (msg) {
   const {key, msgtype} = msg

   let sisCourseCode = 0
   if (msgtype === type.students) {
     sisCourseCode = ugParser.parseKeyStudent(key)
   }
   if (msgtype === type.teachers || msgtype === type.assistants || msgtype === type.courseresponsibles) {
     sisCourseCode = ugParser.parseKeyTeacher(key)
   }
   if (!sisCourseCode) {
     log.error('\nCourse code not parsable from Key. type, ' + msgtype + ' key, ' + key)
     return Promise.reject(Error('Key parse error, type, ' + msgtype + ' key, ' + key))
   }
   return Promise.resolve(sisCourseCode)
 }

 function _process (msg) {
   let sisCourseCode = ''
   let sisCourseCodeFunction
   if (msg._desc.userType === type.omregistrerade) {
     sisCourseCodeFunction = calcSisForOmregistrerade
   } else {
     sisCourseCodeFunction = _parseKey
   }

   return sisCourseCodeFunction(msg)
    .then(_sisCourseCode => { sisCourseCode = _sisCourseCode })
    .then(() => createCsvFile(msg, sisCourseCode, csvDir, csvVol))
    .then(csvObject => {
      log.info('FileName: ', csvObject.csvFileName)
      return csvObject.csvFileName
    })
    .then(fileName => canvasApi.sendCsvFile(fileName, true))
    .then(canvasReturnValue => {
      let document = {msg: msg, resp: canvasReturnValue}
      log.info(document)
      return document
    })
 }

 module.exports = function (msg, counter) {
   log.info('Processing for msg..... ' + msg.ug1Name)
   var msgtype = msg._desc.userType
   if (msg._desc && (msgtype === type.students || msgtype === type.omregistrerade || msgtype === type.teachers || msgtype === type.assistants || msgtype === type.courseresponsibles)) {
     return _process(msg)
   } else {
     log.error('This is something else than students, teacher, assistant, courseresponsibles we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
     return Promise.resolve('Unknown flag: ' + msgtype)
   }
 }
