const test = require('tape')
require('rewire-global')

test('should only create the header when message has no members', t => {
  t.plan(1)
  const createCsvFile = require('../../messages/createCsvFile')
  const azureStorage = createCsvFile.__get__('azureStorage')
  azureStorage.cloudStoreTextToFile = ()=>Promise.resolve()
  azureStorage.cloudgetFile = ()=>Promise.resolve({name:'a cloud file name'})

  const message = {
    _desc: {
      userType: 'students'
    }
  }

  createCsvFile(message, 'SF1626VT171', '/tmp/', 'dev-lms-csv').then(result => {
    // TODO: should this really return the name from azure?
    t.deepEqual(result, {csvContent: 'course_id,user_id,role,status\n', csvFileName: '/tmp/a cloud file name'})
  })
})

test.only('should create the header and one more line when message has one member', t => {
  t.plan(1)
  const createCsvFile = require('../../messages/createCsvFile')

  const azureStorage = createCsvFile.__get__('azureStorage')
  azureStorage.cloudStoreTextToFile = ()=>Promise.resolve()
  azureStorage.cloudgetFile = ()=>Promise.resolve({name:'a cloud file name'})

  const sisCourseCode = 'SF1626VT171'

  const message = {
    _desc: {
      userType: 'students',
    },
    member: ['abc123']
  }

  createCsvFile(message, sisCourseCode, '/tmp/', 'dev-lms-csv').then(result => {
    // TODO: should this really return the name from azure?
    const expectedCsvContent = `course_id,user_id,role,status
${sisCourseCode},abc123,students,active
`
    t.deepEqual(result, {csvContent: expectedCsvContent, csvFileName: '/tmp/a cloud file name'})
  })
})

test('should create the file when sisCourseCode is an array', t => {
  t.plan(1)
  t.equal(1, 0)
})
