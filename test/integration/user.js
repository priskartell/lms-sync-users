var test = require('tape')
const {deleteEveryUserInCanvas, simulateQueueMessage} = require('./utils')
const canvasApi = require('../../canvasApi')
const config = require('../../server/init/configuration')
const consumeMessages = require('../../messages/consumeMessages')
const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
const Promise = require('bluebird')
console.log('TODO: SHOULD start docker image before tests run!')
// docker run --name canvas-docker -p 3000:3000 lbjay/canvas-docker

// Overwrite to use an empty queue
config.full.azure.queueName = 'lms-sync-integration-tests-' + new Date().getTime()

test.only('should create a message on the queue and then read the same message', t => {
  t.plan(1)
  const message = {1:2}
  console.log('using qeue:', config.full.azure.queueName)

  queue.createQueueIfNotExists(config.full.azure.queueName)
  .then(()=>queue.sendQueueMessage(config.full.azure.queueName, message))
  .then(()=>consumeMessages.readMessage())
  .then(res=> t.assert(res.body, message))
  .then(()=> queue.deleteQueue(config.full.azure.queueName))
})
