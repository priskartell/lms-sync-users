'use strict'
const Promise = require('bluebird')
const config = require('../server/init/configuration')
const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
const log = require('../server/init/logging')
const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')

const memwatch = require('memwatch-next')

memwatch.on('leak', function (info) {
  console.log('memory leak!', JSON.stringify(info, null, 4))
  process.exit()
})


let isReading = false

function start () {
  setInterval(readMessage, 100)
}

function abortIfNoMessage (msg) {
  if (!msg) {
    // Best way to abort a promise chain is by a custom error according to:
    // http://stackoverflow.com/questions/11302271/how-to-properly-abort-a-node-js-promise-chain-using-q

    throw new Error('abort_chain')
  }

  return msg
}

function parseBody (msg) {
  return Promise.resolve()
  .then(() => {
    log.debug('message:', msg.body)
    return JSON.parse(msg.body)
  })
  .catch(e => {
    log.warn('an error occured while trying to parse json:', e, msg)
    queue.deleteMessageFromQueue(msg)
    abort()
  })
}

function readMessage () {
  process.stdout.write('.')
  if (isReading) {
    // console.log('is already reading a message, abort')
    return
  } else {
    isReading = true

    // console.log("reading...");
    let message
    queue
      .readMessageFromQueue(config.secure.azure.queueName)
      .then(msg => {
        message = msg
        // console.log('msg', msg);
        return message
      })
      // .then(msg=> Promise.delay(1000,msg))
      .then(abortIfNoMessage)
      .then(parseBody)
      .then(addDescription)
      // .then(handleMessage)
      .then(() => queue.deleteMessageFromQueue(message))
      // .then(readMessage)
      .catch(e => {
        if (e.message !== 'abort_chain') {
          log.info('\nAn Error occured.....')
          log.error('Exception: ', e)
        }
      })
      .finally(() => {
        isReading = false
      })
  }
}

module.exports = {
  start,
  readMessage
}
