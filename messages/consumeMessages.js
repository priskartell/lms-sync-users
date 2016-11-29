'use strict'

const config = require('../server/init/configuration')
const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
const log = require('../server/init/logging')
const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')

function parseBody (msg) {
  return Promise.resolve()
  .then(() => JSON.parse(msg.body))
  .catch(e => {
    console.warn('an error occured while trying to parse json:', e, msg)
    queue.deleteMessageFromQueue(msg)
    throw e
  })
}

// console.log('queue', queue, queue.readMessageFromQueue)
function readMessage () {
  let message
  return queue
    .readMessageFromQueue(config.secure.azure.queueName)
    .then(_msg => {
      message = _msg
      if (!_msg) {
        // Best way to abort a promise chain is by a custom error according to:
        // http://stackoverflow.com/questions/11302271/how-to-properly-abort-a-node-js-promise-chain-using-q
        throw new Error('abort_chain')
      }

      return message
    })
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
