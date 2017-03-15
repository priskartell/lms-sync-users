var test = require('tape')
require('rewire-global').enable()
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const consumeMessages = proxyquire('../../../messages/consumeMessages.js', {'node-queue-adapter': sinon.stub()})
const initLogger = consumeMessages.__get__('initLogger')
const log = consumeMessages.__get__('log')

test.only('should init the logger when a message without body is passed', t => {
  t.plan(1)
  log.init = sinon.stub()

  const message = {
    applicationProperties: {
      UGVersion: 123
    },
    properties: {
      messageId: 'abc'
    }
  }

  initLogger(message)

  t.ok(log.init.calledWith({
    kthid: undefined,
    ug1Name: undefined,
    ugversion: 123,
    messageId: 'abc'
  }))
})

test('should init the logger when a message without a body is passed', t => {
  t.plan(1)
  log.init = sinon.stub()

  const message = {
    customProperties: {
      ugversion: 123
    },
    brokerProperties: {
      MessageId: 'abc'
    }
  }

  initLogger(message)

  t.ok(log.init.calledWith({
    kthid: undefined,
    ug1Name: undefined,
    ugversion: 123,
    messageId: 'abc'
  }))
})

test('should init the logger when a message with a body, without kthid or ug1name is passed', t => {
  t.plan(1)
  log.init = sinon.stub()

  const message = {
    body: {1: 2},
    customProperties: {
      ugversion: 123
    },
    brokerProperties: {
      MessageId: 'abc'
    }
  }

  initLogger(message)

  t.ok(log.init.calledWith({
    kthid: undefined,
    ug1Name: undefined,
    ugversion: 123,
    messageId: 'abc'
  }))
})

test('should init the logger when a message with a body, with kthid and ug1name is passed', t => {
  t.plan(1)
  log.init = sinon.stub()

  const message = {
    body: {ug1Name: 'someUg1Name', kthid: 'someKthid'},
    customProperties: {
      ugversion: 123
    },
    brokerProperties: {
      MessageId: 'abc'
    }
  }

  initLogger(message)

  t.ok(log.init.calledWith({
    kthid: 'someKthid',
    ug1Name: 'someUg1Name',
    ugversion: 123,
    messageId: 'abc'
  }))
})

test('should init the logger without any message settings when null message is passed', t => {
  t.plan(1)
  log.init = sinon.stub()

  initLogger(null)

  t.ok(log.init.calledWith({}))
})
