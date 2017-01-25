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
   console.log('msg', msg)
   const {ug1Name, _desc} = msg
   const {userType} = _desc

   if (userType === type.students) {
     return Promise.resolve(ugParser.parseKeyStudent(ug1Name))
   }

   if (userType === type.teachers || userType === type.assistants || userType === type.courseresponsibles) {
     return Promise.resolve(ugParser.parseKeyTeacher(ug1Name))
   }

   log.error('Course code not parsable from Key. type, ',userType + ' ug1Name, ' + ug1Name)
   return Promise.reject(Error('Key parse error, type, ' + userType + ' ug1Name, ' + ug1Name))
 }

 function _process (msg) {
   let sisCourseCode = ''
   let sisCourseCodeFunction
   if (msg._desc.userType === type.omregistrerade) {
     log.info('using calcSisForOmregistrerade')
     sisCourseCodeFunction = calcSisForOmregistrerade
   } else {
     log.info('using _parseKey')
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
