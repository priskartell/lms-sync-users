'use strict'
const Promise = require('bluebird')
const config = require('../server/init/configuration')
const log = require('../server/init/logging')
const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')
const {Client: AMQPClient, Policy} = require('amqp10')
const urlencode = require('urlencode')
const client = new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))

function start () {
  return client.connect(`amqps://RootManageSharedAccessKey:${urlencode(config.full.secure.azure.SharedAccessKey)}@lms-queue.servicebus.windows.net`)
    .then(() => {
      return client.createReceiver(config.full.secure.azure.queueName)
    })
    .then(receiver => {
      log.info('receiver created....')
      receiver.on('errorReceived', err => log.info(err))
      receiver.on('message', function (message) {
        log.info('New message from ug queue....')
        if (message.body) {
          return _processMesage(receiver, message)
        } else {
          log.info('Message is emptry or undefined, deteting from queue...', message)
          return receiver.reject(message)
        }
      })
    })
}

function _processMesage (receiver, MSG) {
  initLogger(MSG)
  .then(addDescription)
  .then(handleMessage)
  .then(_result => {
    log.info('result from handleMessage', _result)
  })
  .then(() => receiver.accept(MSG))
  .catch(e => {
    log.error(e)
    log.info('Error Occured, releaseing message back to queue...', MSG)
    return receiver.reject(MSG, e)
  })
}

function initLogger (msg) {
  let bodyPromise
  if (msg && msg.body) {
    bodyPromise = Promise.resolve(msg.body)
  } else {
    bodyPromise = Promise.resolve({})
  }

  return bodyPromise.then(body => {
    console.log(body)
    const config = {
      kthid: body && body.kthid,
      ug1Name: body && body.ug1Name,
      ugversion: (msg && msg.customProperties && msg.customProperties.ugversion) || undefined,
      messageId: (msg && msg.brokerProperties && msg.brokerProperties.MessageId) || undefined
    }
    log.init(config)
    if (msg && msg.body) {
      return msg.body
    } else {
      return {}
    }
  })
}

module.exports = {
  start
}
