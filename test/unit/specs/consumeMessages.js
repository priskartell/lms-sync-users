
var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()
const Promise = require('bluebird') // enable Promise.finally()

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

function readMessageUnlessReading(){
  consumeMessages.__get__('readMessageUnlessReading')()
}

test('if it is already reading, then it should just return ', t=>{
  t.plan(1)
  readMessage = sinon.stub()
  consumeMessages.__set__('readMessage', readMessage)
  consumeMessages.__set__('isReading', true)

  readMessageUnlessReading()
  t.equal(readMessage.called,false)
})

test('if it is not already reading, then it should just call readMessage ', t=>{
  t.plan(1)
  readMessage = sinon.stub()
  consumeMessages.__set__('readMessage', readMessage)
  consumeMessages.__set__('isReading', false)

  readMessageUnlessReading()
  t.equal(readMessage.called,true)
})

// test.skip('no message from azure should abort promise chain',t =>{
//   t.plan(1)
//   consumeMessages.__set__('isReading', false)
//   const parseBody = sinon.stub()
//   consumeMessages.__set__('parseBody', parseBody)
//   consumeMessages.readMessage().then(msg =>{
//       t.equal(parseBody.called, false)
//   })
})

// test('read message without body should call read message again', t => {})
//
// test('read message without message should call read message again', t => {})
//
// test('read message with incorrect body should call read message again', t => {})
//
// test('read message with correct body should call read message again', t => {})
