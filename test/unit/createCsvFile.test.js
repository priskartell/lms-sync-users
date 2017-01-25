const test = require('tape')
require('rewire-global')
test.only('should only create the header when message has no members', t => {
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
    t.deepEqual(result, {csvContent: 'course_id,user_id,role,status\n', csvFileName: '/tmp/a cloud file name'})
  })
})

test('should create the file when sisCourseCode is an array', t => {
  t.plan(1)
  t.equal(1, 0)
})
