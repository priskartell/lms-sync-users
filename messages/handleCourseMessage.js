 'use strict'

 const {type} = require('message-type')
 const canvasApi = require('../canvasApi')
 const config = require('../server/init/configuration')
 const log = require('../server/init/logging')
 const ugParser = require('./ugParser')
 const calcSisForOmregistrerade = require('./calcSisForOmregistrerade')
 const createCsvFile = require('./createCsvFile')

 const csvVol = config.full.azure.csvBlobName
 const csvDir = config.full.localFile.csvDir

 function _parseKey ({ug1Name, _desc}) {
   const {userType} = _desc

   if (userType === type.students) {
     return Promise.resolve(ugParser.parseKeyStudent(ug1Name))
   }

   if (userType === type.teachers || userType === type.assistants || userType === type.courseresponsibles) {
     return Promise.resolve(ugParser.parseKeyTeacher(ug1Name))
   }

   log.error('Course code not parsable from Key. type, ', userType + ' ug1Name, ' + ug1Name)
   return Promise.reject(Error('Key parse error, type, ' + userType + ' ug1Name, ' + ug1Name))
 }

 function process (msg) {
   let sisCourseCodeFunction
   if (msg._desc.userType === type.omregistrerade) {
     log.info('using calcSisForOmregistrerade')
     sisCourseCodeFunction = calcSisForOmregistrerade
   } else {
     log.info('using _parseKey')
     sisCourseCodeFunction = _parseKey
   }

   return sisCourseCodeFunction(msg)
    .then(sisCourseCode => createCsvFile(msg, sisCourseCode, csvDir, csvVol))
    .then(({name}) => canvasApi.sendCsvFile(name, true))
    .then(canvasReturnValue => {
      return {msg, resp: canvasReturnValue}
    })
 }

 module.exports = process
