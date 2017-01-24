var test = require('tape')
const {type} = require('message-type')
const proxyquire = require('proxyquire')
require('rewire-global')
const sinon = require('sinon')

const canvasApi = require('../../../canvasApi')

test.only('should call calcSisForOmregistrerade if msg type is OMREG', t => {
  const calcSisForOmregistrerade = sinon.stub()

  const handleCourseMessages = proxyquire('../../../messages/handleCourseMessage', {'./calcSisForOmregistrerade': calcSisForOmregistrerade})
  t.plan(1)
  console.log(JSON.stringify(type, null, 4))
  const process = handleCourseMessages.__get__('_process')


  canvasApi.findCourse = sinon.stub()
  handleCourseMessages.__set__('_createCsvFile', sinon.stub().throws(new Error('just an error to abort the promise chain')))
  process(
    {
      _desc: {
        userType: type.omregistrerade}
    }).catch(arg => {
      // This is really ugly and just a temporary test/implementation until handleCourseMessages is refactored
      t.ok(calcSisForOmregistrerade.called)
    })
})
