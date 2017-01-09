var test = require('tape')
const {deleteEveryUserInCanvas, simulateQueueMessage} = require('./utils')
const canvasApi = require('../../canvasApi')
const config = require('../../server/init/configuration')
const consumeMessages = require('../../messages/consumeMessages')

console.log('TODO: SHOULD start docker image before tests run!')
// docker run --name canvas-docker -p 3000:3000 lbjay/canvas-docker

// Overwrite to use an empty queue
// config.full.azure.queueName = 'lms-sync-integration-tests'

test.only('should create a user in canvas', t => {
  t.plan(1)
  // TODO: specify queue message!
  consumeMessages.readMessage()
  .then(()=> canvasApi.getUser('kth_id_integration_test'))
  .then(user => t.ok(user))
})
