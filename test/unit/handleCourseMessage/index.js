var test = require('tape')
require('rewire-global')
const sinon = require('sinon')
const handleCourseMessages = require('../../../messages/handleCourseMessage')

test.only('should skip the message when the course doesnt exist in canvas', t => {
  t.plan(1)
  const canvasApi = require('../../../canvasApi')
  canvasApi.findCourse = sinon.stub().returns(Promise.reject({statusCode:404}))
  const createCsvFile = sinon.stub()
  handleCourseMessages.__set__('_createCsvFile', createCsvFile)
  const message = {} // Any message is fine since canvas api is stubbed

  handleCourseMessages(message)
  .then(()=>{
      t.notOk(createCsvFile.called)
      t.end()
  })
})
