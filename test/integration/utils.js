const config = require('../../config/serverSettings')
const Promise = require('bluebird')
const rewire = require('rewire')
const consumeMessages = rewire('../../messages/consumeMessages')

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
    config.azure.queueName = config.azure.queueName = 'lms-sync-integration-tests-' + Math.random().toString(36)

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

const sharedAccessKey = process.env.AZURE_SHARED_ACCESS_KEY || config.azure.SharedAccessKey

const queueConnectionString = `Endpoint=sb://${config.azure.host}/;SharedAccessKeyName=${config.azure.SharedAccessKeyName};SharedAccessKey=${sharedAccessKey}`
const queue = require('node-queue-adapter')(queueConnectionString)
module.exports = {
  handleMessages
}
