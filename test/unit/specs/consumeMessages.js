
var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const readMessageFromQueueStub = sinon.stub()
const queue = sinon.stub().returns({
  readMessageFromQueue: readMessageFromQueueStub
})

const consumeMessages = proxyquire('../../../messages/consumeMessages', {
  'node-queue-adapter': queue,
  './deleteMessage': sinon.stub().returns(Promise.resolve()),
  './handleMessage': sinon.stub().returns(Promise.resolve())
})

// overwrite original function to be able to break the eternal loop in the test
const readMessage = consumeMessages.readMessage
const readMessageStub = sinon.stub()
consumeMessages.__set__('readMessage', readMessageStub)

test('read message without body should call read message again', t => {
  t.plan(1)
  readMessageFromQueueStub.returns(Promise.resolve({}))

  readMessage()
    .then(res => t.equal(readMessageStub.called, true))
})

test('read message without message should call read message again', t => {
  t.plan(1)
  readMessageFromQueueStub.returns(Promise.resolve())

  readMessage()
    .then(res => t.equal(readMessageStub.called, true))
})

test('read message with incorrect body should call read message again', t => {
  t.plan(1)
  readMessageFromQueueStub.returns(Promise.resolve({
    body: ''
  }))

  readMessage()
    .then(res => t.equal(readMessageStub.called, true)
  )
})

test('read message with correct body should call read message again', t => {
  t.plan(1)
  readMessageFromQueueStub.returns(Promise.resolve({
    body: '{}'
  }))

  readMessage()
    .then(res => t.equal(readMessageStub.called, true))
})
