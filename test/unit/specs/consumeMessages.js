
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

test('read message without body should call read message again', t => {})

test('read message without message should call read message again', t => {})

test('read message with incorrect body should call read message again', t => {})

test('read message with correct body should call read message again', t => {})
