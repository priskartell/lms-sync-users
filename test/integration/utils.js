const config = require('../../server/init/configuration')
const Promise = require('bluebird')

const consumeMessages = require('../../messages/consumeMessages')

function handleMessages (...messages) {
  console.log('handle messages', messages)
  config.full.azure.queueName = 'lms-sync-integration-tests-' + Math.random().toString(36)
  config.secure.azure.queueName = config.full.azure.queueName

  function sendAndReadMessage (message) {
    console.log('Send and read a message', message)
    return queue.sendQueueMessage(config.full.azure.queueName, message)
    .then(() => consumeMessages.start())
    .then(receiver => {

      receiver.on('message',  message => {
        console.log('message received', message)
      })

      return new Promise((resolve, reject)=>{
        console.log('...')
      })
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
