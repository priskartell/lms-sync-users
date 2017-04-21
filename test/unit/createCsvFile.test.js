const test = require('tape')
require('rewire-global')

const createCsvFile = require('../../messages/createCsvFile')
const azureStorage = createCsvFile.__get__('azureStorage')
azureStorage.cloudStoreTextToFile = () => Promise.resolve()
azureStorage.cloudgetFile = () => Promise.resolve({name: 'a cloud file name'})

test('should only create the header when message has no members', t => {
  t.plan(1)
  const message = {
    _desc: {
      userType: 'students'
    },
    member: []
  }

  createCsvFile(message, 'SF1626VT171', '/tmp/', 'dev-lms-csv').then(result => {
    // TODO: should this really return the name from azure?
    t.deepEqual(result, {csvContent: 'section_id,user_id,role,status\n', name: '/tmp/a cloud file name'})
  })
})

test('should create the header and one more line when message has one member', t => {
  t.plan(1)

  const sisCourseCode = 'SF1626VT171'

  const message = {
    _desc: {
      userType: 'students'
    },
    member: ['abc123']
  }

  createCsvFile(message, sisCourseCode, '/tmp/', 'dev-lms-csv')
  .then(({csvContent}) => {
    // TODO: should this really return the name from azure?
    const expectedCsvContent = `section_id,user_id,role,status
${sisCourseCode},abc123,students,active
`
    t.deepEqual(csvContent, expectedCsvContent)
  })
})

test('should create the file with one line per sisCourseCode when sisCourseCode is an array', t => {
  t.plan(1)

  const message = {
    _desc: {
      userType: 'students'
    },
    member: ['abc123']
  }

  createCsvFile(message, ['SF1626VT171', 'SF1626VT172'], '/tmp/', 'dev-lms-csv').then(({csvContent}) => {
      // TODO: should this really return the name from azure?
    const expectedCsvContent = `section_id,user_id,role,status
SF1626VT171,abc123,students,active
SF1626VT172,abc123,students,active
`
    t.deepEqual(csvContent, expectedCsvContent)
  })
})
