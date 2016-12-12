'use strict'
const cl = require('./azureStorage')
const usage = require('usage')
const memwatch = require('memwatch-next')
const log = require('./server/init/logging')
let leak = ''
let FILENAME = ''
let BLOBNAME = ''

function _quit (code) {
  log.info(`About to exit with code: ${code} closeing file: ${FILENAME}`)
  cl.cloudStoreTextToExistingFile(FILENAME, BLOBNAME, '{}] \n // Terminating @' + new Date())
  .then(data => { log.info(data); process.exit(code) }) // wait to seconds make sure previous call to azure completes
  .catch(error => log.info(error))
}

function _setSignals () {
  process.on('exit', (code) => {
    _quit(code)
  })
  process.on('SIGINT', (code) => {
    _quit(code)
  })
  process.on('SIGTERM', (code) => {
    _quit(code)
  })
// memwatch.setup()
  memwatch.on('leak', function (info) {
    console.error('Memory leak detected: ', info)
    leak = info
  })
}

function _logSystem (fileName, blobName) {
  let pid = process.pid // you can use any valid PID instead
  let options = { keepHistory: true }
  usage.lookup(pid, options, function (err, result) {
    if (err) {
      log.info(err)
      return Promise.resolve(err)
    } else {
      if (leak) {
        result.leak = leak
      }
      result.time = new Date().getTime()
      let perfString = JSON.stringify(result, null, 4) + ','
      return cl.cloudStoreTextToExistingFile(fileName, blobName, perfString)
  .then(() => log.info(perfString))
  .then(() => log.info('\nAzure Alive.....'))
    }
  })
}

function cloudWatch (blobName, fileNamePrefix) {
  return cl.cloudCreateContainer(blobName)
.then(() => cl.cloudListFile(blobName))
.then(() => {
  let date = new Date()
  let fileName = fileNamePrefix + '.' + date.getTime()
  console.info('Logging to app data to file: ' + fileName)
  FILENAME = fileName
  BLOBNAME = blobName
  return fileName
})
.then(fileName => { cl.cloudStoreTextToFile(fileName, blobName, '// starting @' + new Date() + '\n ['); return fileName })
.then(fileName => setInterval(function () { _logSystem(fileName, blobName) }, 30000))
.then(() => _setSignals())
.catch(error => log.info(error))
}

// _watch('log', 'log')

module.exports = {
  cloudWatch
}
