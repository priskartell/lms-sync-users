var test = require('tape')
const {type} = require('message-type')
const proxyquire = require('proxyquire')
require('rewire-global')
const sinon = require('sinon')

test.skip('should call calcSisForOmregistrerade if msg type is OMREG', t => {
  const calcSisForOmregistrerade = sinon.stub().returns(Promise.reject(new Error('just an error to abort the promise chain')))

  const handleCourseMessages = proxyquire('../../../messages/handleCourseMessage', {'./calcSisForOmregistrerade': calcSisForOmregistrerade})
  t.plan(1)
  const process = handleCourseMessages.__get__('_process')

  process(
    {
      _desc: {
        userType: type.omregistrerade}
    }).catch(arg => {
      // This is really ugly and just a temporary test/implementation until handleCourseMessages is refactored
      t.ok(calcSisForOmregistrerade.called)
    })
})

test.skip('should call _parseKey if msg type is OMREG', t => {
  const _parseKey = sinon.stub().returns(Promise.reject(new Error('just an error to abort the promise chain')))

  const handleCourseMessages = require('../../../messages/handleCourseMessage')
  t.plan(1)
  const process = handleCourseMessages.__get__('_process')
  handleCourseMessages.__set__('_parseKey', _parseKey)

  process(
    {
      _desc: {
        userType: type.students}
    }).catch(arg => {
      // This is really ugly and just a temporary test/implementation until handleCourseMessages is refactored
      t.ok(_parseKey.called)
    })
})

test('should send the csv file for user type is student', t => {
  t.plan(1)
  const canvasApi = require('../../../canvasApi')
  const createCsvFile = sinon.stub().returns({name: 'file.csv'})
  const handleCourseMessages = proxyquire('../../../messages/handleCourseMessage', {'./createCsvFile': createCsvFile})
  canvasApi.sendCsvFile = sinon.stub()
  handleCourseMessages.__set__('parseKey', sinon.stub().returns(Promise.resolve()))
  // .returns(Promise.reject({statusCode:404}))
  const message = {
    _desc: {
      userType: type.students
    }
  }

  handleCourseMessages.handleCourseMessage(message)
  .then(() => {
    t.ok(canvasApi.sendCsvFile.calledWith('file.csv', true))
  })
})
