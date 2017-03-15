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

function start () {
  return client.connect(`amqps://${config.full.azure.SharedAccessKeyName}:${urlencode(config.secure.azure.SharedAccessKey)}@${config.full.azure.host}`)
    .then(() => client.createReceiver(config.secure.azure.queueName || config.full.azure.queueName))
    .then(receiver => {
      log.info('receiver created....')

      receiver.on('errorReceived', err => log.warn('An error occured when trying to receive message from queue', err))

      receiver.on('message', message => {
        Promise.resolve(message)
        .then(initLogger)
        .then(()=>{
          log.info('New message from ug queue', message)
          if (message.body) {
            return _processMessage(message)
          } else {
            log.info('Message is empty or undefined, deleting from queue...', message)
            return receiver.reject(message)
          }
        })
      })

      function _processMessage (MSG) {
        let result
        return Promise.resolve(MSG)
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
          log.info('Error Occured, releaseing message back to queue...', MSG)
          return receiver.reject(MSG)
        })
      }

      return receiver
    })
}

function initLogger (msg) {
  let config
  if (msg) {
    const {body} = msg
    config = {
      kthid: body && body.kthid,
      ug1Name: body && body.ug1Name,
      ugversion: (msg && msg.customProperties && msg.customProperties.ugversion) || undefined,
      messageId: (msg && msg.brokerProperties && msg.brokerProperties.MessageId) || undefined
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
