'use strict'

const config = require('../server/init/configuration')
const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
const log = require('../server/init/logging')
const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')

function abort () {
  // Best way to abort a promise chain is by a custom error according to:
  // http://stackoverflow.com/questions/11302271/how-to-properly-abort-a-node-js-promise-chain-using-q
  throw new Error('abort_chain')
}

function abortIfNoMessage (msg) {
  if (!msg) {
    abort()
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
  let message
  return queue
    .readMessageFromQueue(config.secure.azure.queueName)
    .then(msg => {
      message = msg
      return message
    })
    .then(abortIfNoMessage)
    .then(parseBody)
    .then(addDescription)
    .then(handleMessage)
    .then(() => queue.deleteMessageFromQueue(message))
    .then(readMessage)
    .catch(e => {
      if (e.message !== 'abort_chain') {
        log.info('\nAn Error occured.....')
        log.error('Exception: ', e)
      }
      return readMessage()
    })
}

module.exports = {
  readMessage
}
