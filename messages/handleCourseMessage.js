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

function parseKey ({ug1Name, _desc}) {
  const {userType} = _desc

  if ([type.students, type.antagna].includes(userType)) {
    return ugParser.parseKeyStudent(ug1Name)
  }

  if ([type.teachers, type.assistants, type.courseresponsibles].includes(userType)) {
    return ugParser.parseKeyTeacher(ug1Name)
  }

  log.error('Course code not parsable from Key. type, ', userType + ' ug1Name, ' + ug1Name)
  throw new Error('Key parse error, type, ' + userType + ' ug1Name, ' + ug1Name)
}

function handleCourseMessage (msg) {
  let sisCourseCodeFunction
  if (msg._desc.userType === type.omregistrerade) {
    log.info('using calcSisForOmregistrerade')
    sisCourseCodeFunction = calcSisForOmregistrerade
  } else {
    log.info('using parseKey')
    sisCourseCodeFunction = parseKey
  }

  return Promise.resolve()
  .then(() => sisCourseCodeFunction(msg))
  .then(sisCourseCode => createCsvFile(msg, sisCourseCode, csvDir, csvVol))
  .then(({name}) => canvasApi.sendCsvFile(name, true))
  .then(canvasReturnValue => {
    return {msg, resp: canvasReturnValue}
  })
}

module.exports = {handleCourseMessage, parseKey}
