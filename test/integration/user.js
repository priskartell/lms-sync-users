var test = require('tape')
const config = require('../../server/init/configuration')
// Overwrite on top of line
config.full.azure.queueName = 'lms-sync-integration-tests-' + new Date().getTime()
console.log(config.full.canvas.apiUrl)
config.full.canvas.apiUrl = 'http://localhost:3000/api/v1'
config.secure.canvas.apiKey = 'canvas-docker'


const consumeMessages = require('../../messages/consumeMessages')
const queue = require('node-queue-adapter')(config.secure.azure.queueConnectionString)
const canvasApi = require('../../canvasApi')
console.log('TODO: SHOULD start docker image before tests run!')
// docker run --name canvas-docker -p 3000:3000 lbjay/canvas-docker

test('should create a message on the queue and then read the same message', t => {
  t.plan(1)
  const message = {1: 2}

  queue.createQueueIfNotExists(config.full.azure.queueName)
  .then(() => queue.sendQueueMessage(config.full.azure.queueName, message))
  .then(() => consumeMessages.readMessage())
  .then(res => t.assert(res.body, message))
  .then(() => queue.deleteQueue(config.full.azure.queueName))
})

test.only('should create a new user in canvas', t => {
  t.plan(1)
  const kthid = 'emil1234567'
  const message = {
    kthid,
    'ugClass': 'user',
    'deleted': false,
    'affiliation': ['student'],
    'username': 'some_non_existing2',
    'family_name': 'Stenberg',
    'given_name': 'Emil Stenberg',
    'primary_email': 'esandin@gmail.com'}

  queue.createQueueIfNotExists(config.full.azure.queueName)
  .then(() => queue.sendQueueMessage(config.full.azure.queueName, message))
  .then(() => consumeMessages.readMessage())
  .then(()=> canvasApi.getUser(kthid))
  .then(user => t.ok(user))
  .then(() => queue.deleteQueue(config.full.azure.queueName))
})
