 var test = require('tape')
 require('rewire-global').enable()
 const sinon = require('sinon')
 const proxyquire = require('proxyquire').noCallThru()
 let body

 const queue = sinon.stub().returns({
   readMessageFromQueue: sinon.stub().returns(Promise.resolve({body}))
 })

 const consumeMessages = proxyquire('../../../consumeMessages.js', {
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

   readMessage()
  .then(res => t.equal(readMessageStub.called, true))
 })

 test('read message with incorrect body should call read message again', t => {
   t.plan(1)
   body = ''

   readMessage()
  .then(res => t.equal(readMessageStub.called, true)
  )
 })
