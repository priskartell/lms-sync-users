'use strict'
const config = require('../config')
const log = require('../server/logging')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
const history = require('./history')

const {addDescription} = require('kth-message-type')
const handleMessage = require('./handleMessage')
const rhea = require('rhea')

// TODO: Remove once outdated
/* client.on('connection:closed', msg => log.info('connection:closed event received', msg))
client.on('connection:opened', msg => log.info('connection to azure opened'))
client.on('connection:disconnected', msg => log.info('connection to azure disconnected')) */

async function start () {
  const sharedAccessKey = process.env.AZURE_SHARED_ACCESS_KEY || config.azure.SharedAccessKey
  log.info(`connecting to the following azure service bus: ${config.azure.host}`)
  console.log(config.azure.host)
  const connection = rhea.connect({
    transport: 'tls',
    host: config.azure.host,
    hostname: config.azure.host,
    port: 5671,
    username: config.azure.SharedAccessKeyName,
    password: sharedAccessKey,
    container_id: 'lms-client',
    reconnect_limit: 100 // TODO: Is this even remotely reasonable?
  })

  // TODO: Improve error handling!
  connection.on('connection_open', function (context) {
    log.info('Connection was opened!')
  })
  connection.on('connection_close', function (context) {
    log.warning('Connection was closed!')
  })
  connection.on('connection_error', function (context) {
    log.error('Connection had an error!')
  })
  connection.on('disconnected', function (context) {
    log.warning('Connection was disconnected!')
  })
  connection.on('receiver_open', function (context) {
    log.info('Receiver was opened!')
  })
  connection.on('receiver_close', function (context) {
    log.warning('Receiver was closed!')
  })

  connection.on('message', async function (context) {
    // TODO: Some extended logic might be needed here if we do have a "detached issue"...
    // TODO: Step one will be to decode the message which seems to always(?) come as a Buffer... We crave the JSON!
    if (context.message.body.typecode === 117) {
      const jsonData = {body: JSON.parse(Buffer.from(context.message.body.content).toString())}
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
      context.delivery.modified({deliveryFailed: true, undeliverable_here: false})
    }
  })

  log.info(`opening receiver for subscription: ${config.azure.subscriptionName} @ ${config.azure.subscriptionPath}`)
  connection.open_receiver({
    name: config.azure.subscriptionName,
    source: {
      address: config.azure.subscriptionPath,
      dynamic: false,
      durable: 2, // TODO: Find out if this is reasonable...
      expiry_policy: 'never'
    },
    autoaccept: false,
    credit_window: 1 // TODO: Is this the way to fetch one message at a time?
  })

  // TODO: Remove or enchance!
  /* receiver.on('errorReceived', err => log.warn('An error occured when trying to receive message from queue', err))

  receiver.on('detached', msg => {
    log.info('detached received for receiver ', receiver.id)
    _onDetached && _onDetached(msg)
  })

  receiver.on('message', async message => {
    initLogger(message)
    log.info(`New message from ug queue for receiver ${receiver.id}`, message)
    history.setIdleTimeStart()

    if (message.body) {
      await _processMessage(message)
    } else {
      log.info('Message is empty or undefined, deleting from queue...', message)
      await receiver.accept(message)
    }

    initLogger(message)
  }) */

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
      delivery.modified({deliveryFailed: true, undeliverable_here: false})
    }
  }

  // TODO: What about this return?
  // Return receiver, used by the integration tests
  // return receiver
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
  start,
  eventEmitter
}
