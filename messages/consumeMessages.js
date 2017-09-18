'use strict'
const config = require('../server/init/configuration')
const log = require('../server/init/logging')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
const history = require('./history')

const {addDescription} = require('message-type')
const handleMessage = require('./handleMessage')
require('colors')
const {Client: AMQPClient, Policy} = require('amqp10')
const urlencode = require('urlencode')
const client = new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))
let _onDetached

client.on('connection:closed', msg => log.info('connection:closed event received', msg))
client.on('connection:opened', msg => log.info('connection to azure opened'))
client.on('connection:disconnected', msg => log.info('connection to azure disconnected'))

async function start () {
  const sharedAccessKey = process.env.AZURE_SHARED_ACCESS_KEY || config.secure.azure.SharedAccessKey
  log.info('connecting with the following azure url:', `amqps://${config.full.azure.SharedAccessKeyName}:${(sharedAccessKey || '').replace(/\w/g, 'x')}@${config.full.azure.host}`)
  const queueName = config.secure.azure.queueName || config.full.azure.queueName
  log.info('connecting to the queue with name ', queueName)

  await client.connect(`amqps://${config.full.azure.SharedAccessKeyName}:${urlencode(sharedAccessKey)}@${config.full.azure.host}`)
  const receiver = await client.createReceiver(queueName)

  log.info('receiver created:', receiver.id)

  receiver.on('errorReceived', err => log.warn('An error occured when trying to receive message from queue', err))

  receiver.on('detached', msg => _onDetached && _onDetached(msg))

  receiver.on('message', async message => {
    log.info(`New message from ug queue for receiver ${receiver.id}`, message)
    history.setIdleTimeStart()
    initLogger(message)

    if (message.body) {
      await _processMessage(message)
    } else {
      log.info('Message is empty or undefined, deleting from queue...', message)
      await receiver.accept(message)
    }

    initLogger(message)
  })

  async function _processMessage (MSG) {
    try {
      const body = addDescription(MSG.body)
      const result = await handleMessage(body)
      log.info('result from handleMessage', result)
      eventEmitter.emit('messageProcessed', MSG, result)
      return receiver.accept(MSG)
    } catch (e) {
      log.error(e)
      log.info('Error Occured, releasing message back to queue...', MSG)
      return receiver.modify(MSG, {undeliverableHere: false, deliveryFailed: true})
    }
  }

  // Return receiver, used by the integration tests
  return receiver
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
  eventEmitter,
  set onDetached (cb) {
    _onDetached = cb
  },
  get onDetached () {
    return _onDetached
  }
}
