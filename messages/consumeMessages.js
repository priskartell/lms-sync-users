'use strict'
const Promise = require('bluebird')
const config = require('../server/init/configuration')
const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
const log = require('../server/init/logging')
const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')

const {Client: AMQPClient, Policy} = require('amqp10')
const urlencode = require('urlencode')

const client = new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))
  // const client = new AMQPClient(Policy.ServiceBusQueue)
const localSettings = require('../config/localSettings.js')

function start () {
 return client.connect(`amqps://RootManageSharedAccessKey:${urlencode(localSettings.secure.azure.SharedAccessKey)}@lms-queue.servicebus.windows.net`)
    .then(() => {
      return client.createReceiver(localSettings.secure.azure.queueName)
    })
    .then(receiver => {
      log.info('receiver created....')
      receiver.on('errorReceived', err => log.info(err))
      receiver.on('message', function (message) {
        log.info('New message from ug queue....')
        if (message.body) {
        return _processMesage(receiver,message)
      } else {
        log.info('Message is emptry or undefined, deteting from queue...', message)
        return receiver.reject(message)
      }
    })
  })
}

    function _processMesage(receiver,MSG) {
      return _logInit(MSG)
      .then(addDescription)
      .then(handleMessage)
      .then(_result => {
        log.info('result from handleMessage', _result)
      })
      .then(() => receiver.accept(MSG))
      .catch(e => {
        log.error(e)
        log.info('Error Occured, releaseing message back to queue...', MSG)
        return receiver.reject(MSG,e)
      })
    }

    function _logInit(msg) {
      let body = msg.body
      const config = {
        kthid: body && body.kthid,
        ug1Name: body && body.ug1Name,
        ugversion: (msg && msg.customProperties && msg.customProperties.ugversion) || undefined,
        messageId: (msg && msg.brokerProperties && msg.brokerProperties.MessageId) || undefined
      }
      log.init(config)
      return Promise.resolve(body)
    }

module.exports = {
  start
}
