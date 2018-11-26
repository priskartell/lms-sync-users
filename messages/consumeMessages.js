'use strict'
const config = require('../config')
const log = require('../server/logging')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
const history = require('./history')

const {addDescription} = require('kth-message-type')
const handleMessage = require('./handleMessage')
// TODO: Remove once outdated
// const {Client: AMQPClient, Policy} = require('amqp10')
const rhea = require('rhea')
const urlencode = require('urlencode')
// TODO: Remove once outdated
// const client = new AMQPClient(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue))

// TODO: Remove once outdated
/* client.on('connection:closed', msg => log.info('connection:closed event received', msg))
client.on('connection:opened', msg => log.info('connection to azure opened'))
client.on('connection:disconnected', msg => log.info('connection to azure disconnected')) */

async function start () {
  const sharedAccessKey = process.env.AZURE_SHARED_ACCESS_KEY || config.azure.SharedAccessKey
  log.info('connecting with the following azure url:', `amqps://${config.azure.SharedAccessKeyName}:${(sharedAccessKey || '').replace(/\w/g, 'x')}@${config.azure.host}`)
  const queueName = config.azure.queueName || config.azure.queueName
  log.info('connecting to the queue with name ', queueName)

  // TODO: Remove once outdated
  // await client.connect(`amqps://${config.azure.SharedAccessKeyName}:${urlencode(sharedAccessKey)}@${config.azure.host}`)
  // const receiver = await client.createReceiver(queueName)
  // log.info('receiver created:', receiver.id)

  console.log(config.azure.host)
  const connection = rhea.connect({
    transport: 'tls',
    host: config.azure.host,
    hostname: config.azure.host,
    port: 5671,
    username: 'RootManageSharedAccessKey',
    password: 'H9Fld2dcEyT+AdpqRPF0ek91BHeURaXMX/TG51L1Ie4=',
    container_id: 'lms-client',
    reconnect_limit: 100 // TODO: Is this even remotely reasonable?
  })
  connection.on('message', function (context) {
    // TODO: Some extended logic might be needed here if we do have a "detached issue"...
    if (context.message.body === 'detach') {
      context.receiver.detach()
      context.connection.close()
    } else if (context.message.body === 'close') {
      context.receiver.close()
      context.connection.close()
    } else {
      let parsedString = Buffer.from(context.message.body.content).toString()
      let json = JSON.parse(parsedString)
      log.info('well hello')
    }
  })
  connection.open_receiver({
    name: 'lms-sub-peter',
    source: {
      address: 'lms-topic-peter/Subscriptions',
      dynamic: false,
      durable: 2, // TODO: Find out if this is reasonable...
      expiry_policy: 'never'
    },
    autoaccept: false
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
  return receiver */
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
