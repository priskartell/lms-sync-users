var test = require('tape')
require('rewire-global').enable()
const handleUserMessage = require('../../../messages/handleUserMessage')
const isInScope = handleUserMessage.__get__('isInScope')

test.skip('affiliation: student should be in scope', t => {
  const msg = {
    affiliation: ['student']
  }
  t.plan(1)
  const result = isInScope(msg)
  t.ok(result)
})

test.skip('affiliation: employee should be in scope', t => {
  const msg = {
    affiliation: ['employee']
  }
  t.plan(1)
  const result = isInScope(msg)
  t.ok(result)
})

test.skip('affiliation: member should be in scope', t => {
  const msg = {
    affiliation: ['member']
  }
  t.plan(1)
  const result = isInScope(msg)
  t.ok(result)
})

test.skip('affiliation: other should NOT be in scope', t => {
  const msg = {
    affiliation: ['other']
  }
  t.plan(1)
  const result = isInScope(msg)
  t.notOk(result)
})
