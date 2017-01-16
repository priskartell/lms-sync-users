const config = require('../../server/init/configuration')
const Promise = require('bluebird')

const consumeMessages = require('../../messages/consumeMessages')

function handleMessages (...messages) {
  config.full.azure.queueName = 'lms-sync-integration-tests-' + Math.random().toString(36)

  function sendAndReadMessage (message) {
    return queue.sendQueueMessage(config.full.azure.queueName, message)
    .then(() => consumeMessages.readMessage())
  }

  let result
  return queue.createQueueIfNotExists(config.full.azure.queueName)
  .then(() => Promise.mapSeries(messages, sendAndReadMessage))
  .then(messagesResults => {
    result = messagesResults
  })
  .finally(() => queue.deleteQueue(config.full.azure.queueName))
  .then(()=> result)
}

const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
module.exports = {
  handleMessages
}
