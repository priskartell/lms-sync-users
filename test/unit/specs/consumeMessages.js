 var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

test('read message without body should not fail', t => {
  t.plan(1)
  const queue = sinon.stub().returns({
    readMessageFromQueue: sinon.stub().returns(Promise.resolve({body: '{}'}))
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

  consumeMessages.readMessage()
  .then(res => t.equal(readMessageStub.called, true))
})

test.skip('read message with body should...', function (t) {
  const queue = sinon.stub().returns({
    readMessageFromQueue: sinon.stub().returns(Promise.resolve({body: '{}'}))
  })

  const consumeMessages = proxyquire('../../../consumeMessages.js', {
    'node-queue-adapter': queue
  })

  const readMessage = consumeMessages.__get__('readMessage')

  t.plan(1)

  t.equal(1, 1)
})
