const config = require('../../config')
const Promise = require('bluebird')
const rewire = require('rewire')

const azureSb = require('azure-sb')
const azureCommon = require('azure-common')

const consumeMessages = rewire('../../messages/consumeMessages')

const topicName = 'lms-topic-integration'
const subscriptionName = 'lms-sub-integration'

function createSBService (queueConnectionString) {
  const sBService = azureSb.createServiceBusService(queueConnectionString)
  sBService.logger = new azureCommon.Logger(azureCommon.Logger.LogLevels['TRACE'])

  return {

    sendTopicMessage (topicName, message) {
      if (typeof message === 'object') {
        message = JSON.stringify(message)
      }

      const topicMessage = { body: message }

      return new Promise((resolve, reject) => {
        sBService.sendTopicMessage(topicName, topicMessage, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }
  }
}

const sBConnectionString = `Endpoint=sb://lms-queue.servicebus.windows.net/;SharedAccessKeyName=${config.azure.SharedAccessKeyName};SharedAccessKey=${config.azure.SharedAccessKey}`
const sBService = createSBService(sBConnectionString)

function sendAndWaitUntilMessageProcessed (message) {
  console.log('Send and read a message', message)
  const resultPromise = new Promise((resolve, reject) => {
    consumeMessages.eventEmitter.once('messageProcessed', (msg, result) => {
      console.log('has processed message. Resolve.')
      resolve(result)
    })
  })

  console.log('sending a message to the topic:', topicName)
  sBService.sendTopicMessage(topicName, message).catch(err => console.error(err))

  return resultPromise
}

async function handleMessages (...messages) {
  try {
    console.log('handle messages', messages.length)
    config.azure.subscriptionName = subscriptionName
    config.azure.subscriptionPath = `${topicName}/Subscriptions`
    await consumeMessages.start()
    const result = await Promise.mapSeries(messages, sendAndWaitUntilMessageProcessed)
    console.log('Close the receiver...')
    // TODO: Add some proper code here for shuutting down (also - do we need connection or receiver or both)
    console.log('Close the connection...')
    const connection = consumeMessages.__get__('connection')
    await connection.close()

    /* await new Promise((resolve, reject) => {
      receiver.detach()
      receiver.on('detached', () => resolve())
    })

    console.log('Close the connection...')
    const client = consumeMessages.__get__('client')
    await client.disconnect() */
    return result
  } catch (e) {
    console.error(`An exception occured when running handleMessage: ${e}`)
  }
}

module.exports = {
  handleMessages
}
