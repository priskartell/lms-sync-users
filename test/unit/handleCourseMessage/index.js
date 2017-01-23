var test = require('tape')
require('rewire-global').enable()
const sinon = require('sinon')

test('should be able to mock functions on canvasApi', t => {
  const CanvasApi = require('canvas-api')
  const canvasApi = require('../../../canvasApi')

  CanvasApi.prototype.findCourse = sinon.stub().returns(true)

  t.ok(canvasApi.findCourse())
  t.end()
})
