var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')

test.only('should resolve if message has no _desc field', t => {
  t.plan(1)
  const handleCourseMessage = require('../../../messages/handleCourseMessage.js');

  handleCourseMessage({}).then(result => )

  t.equal(1, 0)
})
