const config = require('../../config')
const Promise = require('bluebird')
const rewire = require('rewire')

const azureSb = require('azure-sb')
const azureCommon = require('azure-common')

const consumeMessages = rewire('../../messages/consumeMessages')

function createQueue(queueConnectionString) {
  const queueService = azureSb.createServiceBusService(queueConnectionString)
  queueService.logger = new azureCommon.Logger(azureCommon.Logger.LogLevels['TRACE'])

  return {
    deleteQueue: Promise.promisify(
      queueService.deleteQueue,
      { context: queueService }
    ),

    createQueueIfNotExists: Promise.promisify(
      queueService.createQueueIfNotExists,
      { context: queueService }
    ),

    sendQueueMessage(queueName, message) {
      if (typeof message === 'object') {
        message = JSON.stringify(message)
      }

      const queueMessage = { body: message }

      return new Promise((resolve, reject) => {
        queueService.sendQueueMessage(queueName, queueMessage, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    }
  }
}

const sharedAccessKey = process.env.AZURE_SHARED_ACCESS_KEY || config.azure.SharedAccessKey
const queueConnectionString = `Endpoint=sb://${config.azure.host}/;SharedAccessKeyName=${config.azure.SharedAccessKeyName};SharedAccessKey=${sharedAccessKey}`
const queue = createQueue(queueConnectionString)

function sendAndWaitUntilMessageProcessed (message) {
  console.log('Send and read a message', message)
  const resultPromise = new Promise((resolve, reject) => {
    consumeMessages.eventEmitter.once('messageProcessed', (msg, result) => {
      console.log('has processed message. Resolve.')
      resolve(result)
    })
  })

  console.log('sending a message to the queue:', config.azure.queueName)
  queue.sendQueueMessage(config.azure.queueName, message)
    .catch(err => console.error(err))

  return resultPromise
}

async function handleMessages (...messages) {
  try {
    consumeMessages.onDetached = () => {}

    console.log('handle messages', messages.length)
    config.azure.queueName = config.azure.queueName = 'lms-sync-users-integration-tests-' + Math.random().toString(36)

    await queue.createQueueIfNotExists(config.azure.queueName)
    const receiver = await consumeMessages.start()
    const result = await Promise.mapSeries(messages, sendAndWaitUntilMessageProcessed)
    console.log('Close the receiver...')
    await new Promise((resolve, reject) => {
      receiver.detach()
      receiver.on('detached', () => resolve())
    })

    console.log('Close the connection...')
    const client = consumeMessages.__get__('client')
    await client.disconnect()
    return result
  } finally {
    queue.deleteQueue(config.azure.queueName)
  }
}

module.exports = {
  handleMessages
}
