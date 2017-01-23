var test = require('tape')
const rewire = require('rewire')
const sinon = require('sinon')
const handleCourseMessages = rewire('../../../messages/handleCourseMessage')

test.skip('should skip the handling of the csv file if the course doesnt exist in canvas', t => {
  const canvasApi = require('../../../canvasApi')

  canvasApi.findCourse = sinon.stub().returns()
  handleCourseMessages._process()
  t.ok(canvasApi.findCourse())
  t.end()
})
