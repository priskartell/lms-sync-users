
var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

require('kth-node-log').init({
  level: 'error',
  console: {
    enabled: true
  }})

const readMessageFromQueueStub = sinon.stub().returns(Promise.resolve())
const deleteMessageFromQueue = sinon.stub().returns(Promise.resolve())

const queue = sinon.stub().returns({
  readMessageFromQueue: readMessageFromQueueStub,
  deleteMessageFromQueue
})

const consumeMessages = proxyquire('../../../messages/consumeMessages', {
  'node-queue-adapter': queue,
  './handleMessage': sinon.stub().returns(Promise.resolve())
})

// overwrite original function to be able to break the eternal loop in the test
const readMessage = consumeMessages.readMessage
const readMessageStub = sinon.stub()
consumeMessages.__set__('readMessage', readMessageStub)

function reset () {
  readMessageFromQueueStub.reset()
  deleteMessageFromQueue.reset()
}

test.only('is already reading should just return ', t=>{
  consumeMessages.__set__('isReading', true)
  t.plan(1)
  consumeMessages.readMessage()
  t.equal(readMessageFromQueueStub.called,false)
})

test('read message without body should call read message again', t => {
  t.plan(2)
  reset()
  readMessageFromQueueStub.returns(Promise.resolve({}))

  readMessage()
    .then(res => {
      t.equal(readMessageStub.called, true)
      t.equal(deleteMessageFromQueue.called, true)
    })
})

test('read message without message should call read message again', t => {
  t.plan(2)
  reset()

  readMessageFromQueueStub.returns(Promise.resolve())

  readMessage()
    .then(res => {
      t.equal(readMessageStub.called, true)
      t.equal(deleteMessageFromQueue.called, false)
    })
})

test('read message with incorrect body should call read message again', t => {
  t.plan(2)
  reset()

  readMessageFromQueueStub.returns(Promise.resolve({
    body: ''
  }))

  readMessage()
    .then(res => {
      t.equal(readMessageStub.called, true)
      t.equal(deleteMessageFromQueue.called, true) // its ok to keep these messages. They will eventually be moved to the error queue where they will be reported as incorrect messages
    })
})

test('read message with correct body should call read message again', t => {
  t.plan(2)
  reset()

  readMessageFromQueueStub.returns(Promise.resolve({
    body: '{}'
  }))

  readMessage()
    .then(res => {
      t.equal(readMessageStub.called, true)
      t.equal(deleteMessageFromQueue.called, true)
    })
})
