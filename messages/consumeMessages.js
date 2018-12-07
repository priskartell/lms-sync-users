'use strict'
const log = require('../server/logging')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
const history = require('./history')
const { addDescription } = require('kth-message-type')
const handleMessage = require('./handleMessage')
const rhea = require('rhea')
require('dotenv').config()

let connection
let receiver

async function start () {
  const sharedAccessKey = process.env.AZURE_SHARED_ACCESS_KEY
  log.info(`connecting to the following azure service bus: ${process.env.AZURE_SERVICE_BUS_URL}`)
  connection = rhea.connect({
    transport: 'tls',
    host: process.env.AZURE_SERVICE_BUS_URL,
    hostname: process.env.AZURE_SERVICE_BUS_URL,
    port: 5671,
    username: process.env.AZURE_SHARED_ACCESS_KEY_NAME,
    password: sharedAccessKey,
    container_id: 'lms-client',
    reconnect: true,
    reconnect_limit: 100
  })

  // TODO: Improve error handling!
  connection.on('connection_open', function (context) {
    log.info('Connection was opened!')
  })
  connection.on('connection_close', function (context) {
    log.warn('Connection was closed!')
  })
  connection.on('connection_error', function (context) {
    log.error(`Connection had an error: ${context.connection.get_error()}`)
  })
  connection.on('disconnected', function (context) {
    log.warn('Connection was disconnected!')
  })
  connection.on('receiver_open', function (context) {
    log.info('Receiver was opened!')
  })
  connection.on('receiver_close', function (context) {
    log.warn('Receiver was closed!')
    log.warn(context)
  })

  connection.on('message', async function (context) {
    // NOTE: Seems like this is the way to handle detachment issues...
    if (context.message.body === 'detach') {
      log.warn('Receiver was told to detached!')
      context.receiver.detach()
      context.connection.close()
    } else if (context.message.body === 'close') {
      log.warn('Receiver was told to close!')
      context.receiver.close()
      context.connection.close()
    } else if (context.message.body.typecode === 117) {
      const jsonData = { body: JSON.parse(Buffer.from(context.message.body.content).toString()) }
      initLogger(jsonData)
      log.info(`New message from ug queue for receiver ${connection.id}`, jsonData)
      history.setIdleTimeStart()

      if (jsonData.body) {
        await _processMessage(jsonData, context.delivery)
      } else {
        log.info('Message is empty or undefined, deleting from queue...', jsonData)
        context.delivery.accept()
      }

      initLogger(jsonData)
    } else {
      log.error(`An unexpected content type was received: ${context.message.body.typecode}`)
      context.delivery.modified({ deliveryFailed: true, undeliverable_here: false })
    }
    receiver.add_credit(1)
  })

  log.info(`opening receiver for subscription: ${process.env.AZURE_SUBSCRIPTION_NAME} @ ${process.env.AZURE_SUBSCRIPTION_PATH}`)
  receiver = connection.open_receiver({
    name: process.env.AZURE_SUBSCRIPTION_NAME,
    source: {
      address: process.env.AZURE_SUBSCRIPTION_PATH,
      dynamic: false,
      durable: 2, // NOTE: Value taken from rhea official code example for durable subscription reader.
      expiry_policy: 'never'
    },
    autoaccept: false,
    credit_window: 0 // NOTE: Handling when to receive a message manually
  })
  receiver.add_credit(1)

  async function _processMessage (MSG, delivery) {
    try {
      const body = addDescription(MSG.body)
      const result = await handleMessage(body)
      log.info('result from handleMessage', result)
      eventEmitter.emit('messageProcessed', MSG, result)
      delivery.accept()
    } catch (e) {
      log.error(e)
      log.info('Error Occured, releasing message back to queue...', MSG)
      delivery.modified({ deliveryFailed: true, undeliverable_here: false })
    }
  }
}

function initLogger (msg) {
  let config
  if (msg) {
    const { body } = msg
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
  start,
  eventEmitter
}
