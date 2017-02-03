'use strict'
const Promise = require('bluebird')
const config = require('../server/init/configuration')
const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
const log = require('../server/init/logging')
const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')

let isReading = false

function start () {
  setInterval(readMessageUnlessReading, 50)
}

function abort () {
  // Best way to abort a promise chain is by a custom error according to:
  // http://stackoverflow.com/questions/11302271/how-to-properly-abort-a-node-js-promise-chain-using-q

  throw new Error('abort_chain')
}

function abortIfNoMessage (msg) {
  if (!msg || !msg.body) {
    abort()
  }

  return msg
}

function parseBody (msg) {
  return Promise.resolve()
  .then(() => JSON.parse(msg.body))
  .catch(e => {
    log.warn('an error occured while trying to parse json:', e, msg)
    queue.deleteMessageFromQueue(msg)
    abort()
  })
}

function initLogger (msg) {
    debugger
  // log.debug('about to init logger for message:', msg)
  let body
  if (msg && msg.body) {
    body = Promise.resolve().then(() => JSON.parse(msg.body))
    .catch(error => {
       // An error means that we couldnt parse the body. Use an empty body for init of the logger
       // We dont have to handle the error here, the message will be parsed again down the chain
      log.info(error)

      return {}
    })
  } else {
    body = Promise.resolve({})
  }
  return body.then(body => {
    const config = {
      kthid: body && body.kthid,
      ug1Name: body && body.ug1Name,
      ugversion: (msg && msg.customProperties && msg.customProperties.ugversion) || undefined,
      messageId: (msg && msg.brokerProperties && msg.brokerProperties.MessageId) || undefined
    }
    log.init(config)
    return msg
  })
}

function readMessage () {
  isReading = true
  let message, result
  return queue
    .readMessageFromQueue(config.secure.azure.queueName || config.full.azure.queueName)
    .then(initLogger)
    .then(msg => {
      message = msg
      log.debug('message received from queue', msg)
      return message
    })
    .then(abortIfNoMessage)
    .then(parseBody)
    .then(addDescription)
    .then(handleMessage)
    .then(_result => {
      log.info('result from handleMessage', _result)
      result = _result
    })
    .then(() => queue.deleteMessageFromQueue(message))
    .then(() => result)
    .catch(e => {
      if (e.message !== 'abort_chain') {
        log.error(e)
      }
    })
    .finally(() => {
      isReading = false
    })
}

function readMessageUnlessReading () {
  if (isReading) {
    // console.log('is already reading a message, abort')
    return
  } else {
    readMessage()
  }
}

module.exports = {
  start, readMessage
}
