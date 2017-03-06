const config = require('../../server/init/configuration')
const Promise = require('bluebird')
const sinon = require('sinon')
const consumeMessages = require('../../messages/consumeMessages')

function handleMessages (...messages) {
  console.log('handle messages', messages.length)
  config.full.azure.queueName = 'lms-sync-integration-tests-' + Math.random().toString(36)
  config.secure.azure.queueName = config.full.azure.queueName

  function sendAndReadMessage (message) {
    console.log('Send and read a message', message)
    return queue.sendQueueMessage(config.full.azure.queueName, message)
    .then(() => consumeMessages.start())
    .then(receiver => {
      return new Promise((resolve, reject) => {
        const accept = sinon.spy(receiver, 'accept')

        const acceptInterval = setInterval(() => {
          if (accept.callCount == messages.length) {
            console.log('Messages have been accepted by the consumer. Continue.')
            clearInterval(acceptInterval)
            resolve(receiver)
          } else {
            console.log('accept has not yet been called on the receiver...')
          }
        }, 100)
      })
    })
    .then(receiver => {
      console.log('Close the receiver...')
      receiver.detach()
      return new Promise((resolve, reject) => receiver.on('detached', () => resolve()))
    })
    .catch(err => console.error(err))
  }

  let result
  return queue.createQueueIfNotExists(config.full.azure.queueName)
  .then(() => Promise.mapSeries(messages, sendAndReadMessage))
  .then(messagesResults => {
    result = messagesResults
  })
  .finally(() => queue.deleteQueue(config.full.azure.queueName))
  .then(() => result)
}

const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
module.exports = {
  handleMessages
}
