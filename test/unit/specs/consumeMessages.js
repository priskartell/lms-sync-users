var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const queue = sinon.stub().returns(() => {
  readMessageFromQueue: sinon.stub().returns({})
})
const consumeMessages = proxyquire('../../../consumeMessages.js', {
  'node-queue-adapter': queue
})

test('read message', function(t) {
  const readMessage = consumeMessages.__get__('readMessage')

  t.plan(1)

  t.equal(1, 1)
})
