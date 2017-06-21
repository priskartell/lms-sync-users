'use strict'
const Promise = require('bluebird')
const config = require('../server/init/configuration')
const log = require('../server/init/logging')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()

const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')
const {Client: AMQPClient, Policy} = require('amqp10')
const urlencode = require('urlencode')
const client = new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))

client.on('connection:closed', msg => log.info('connection:closed event received', msg))
client.on('connection:opened', msg => log.info('connection to azure opened'))
client.on('connection:disconnected', msg => log.info('connection to azure disconnected'))

function detached (msg) {
  log.info(`Got a detached event for receiver, restart the azure client`)
  client.disconnect()
    .then(() => log.info('Client disconnected'))
    .then(start)
    .catch(e => log.error(e))
}

function start () {
  const sharedAccessKey = process.env.AZURE_SHARED_ACCESS_KEY || config.secure.azure.SharedAccessKey
  log.info('shared access key:', sharedAccessKey)
  log.info('connecting with the following azure url:', `amqps://${config.full.azure.SharedAccessKeyName}:${(sharedAccessKey || '').replace(/\w/g, 'x')}@${config.full.azure.host}`)
  const queueName = config.secure.azure.queueName || config.full.azure.queueName
  log.info('connecting to the queue with name ', queueName)

  return client.connect(`amqps://${config.full.azure.SharedAccessKeyName}:${urlencode(sharedAccessKey)}@${config.full.azure.host}`)
    .then(() => client.createReceiver(queueName))
    .then(receiver => {
      log.info('receiver created:', receiver.id)

      receiver.on('errorReceived', err => log.warn('An error occured when trying to receive message from queue', err))

      receiver.on('detached', detached)

      receiver.on('message', message => {
        log.info(`New message from ug queue for receiver ${receiver.id}`, message)

        Promise.resolve(message)
        .then(initLogger)
        .then(() => {
          if (message.body) {
            return _processMessage(message)
          } else {
            log.info('Message is empty or undefined, deleting from queue...', message)
            return receiver.accept(message)
          }
        })
        .then(initLogger)
      })

      function _processMessage (MSG) {
        eventEmitter.emit('processMessageStart', MSG)
        let result
        return Promise.resolve(MSG.body)
        .then(addDescription)
        .then(handleMessage)
        .then(_result => {
          log.info('result from handleMessage', _result)
          result = _result
        })
        .then(() => receiver.accept(MSG))
        .then(() => eventEmitter.emit('messageProcessed', MSG, result))
        .catch(e => {
          log.error(e)
          log.info('Error Occured, releasing message back to queue...', MSG)
          return receiver.modify(MSG, {undeliverableHere: false, deliveryFailed: true})
        })
      }

      return receiver
    })
    .catch(e => log.error('An error occured:', e))
}

function initLogger (msg) {
  let config
  if (msg) {
    const {body} = msg
    config = {
      kthid: body && body.kthid,
      ug1Name: body && body.ug1Name,
      ugversion: (msg && msg.applicationProperties && msg.applicationProperties.UGVersion) || undefined,
      messageId: (msg && msg.properties && msg.properties.messageId) || undefined
    }
  } else {
    config = {}
  }

  log.init(config)

  return msg && msg.body
}

module.exports = {
  start, eventEmitter
}
