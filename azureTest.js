'use strict'
const cl = require('./azureStorage')

function _test () {
  return cl.cloudCreateContainer('test')
.then(() => console.log('\nlisting files in container test'))
.then(() => cl.cloudListFile('test'))
.then(() => console.log('\n (1) Passed........\n'))
.then(() => console.log('\ncreating 6 files in Azure'))
.then(() => cl.cloudStoreTextToFile('enrollments.STUDENTS.DM1578VT152.1480494800005.csv', 'test', 'Hej på dig ole'))
.then(() => cl.cloudStoreTextToFile('enrollments.STUDENTS.DM1578VT152.1480494800006.csv', 'test', 'Hej på dig dole'))
.then(() => cl.cloudStoreTextToFile('enrollments.STUDENTS.DM1578VT152.1480494800007.csv', 'test', 'Hej på dig dof'))
.then(() => cl.cloudStoreTextToFile('enrollments.STUDENTS.DM1578VT152.1480494800008.csv', 'test', 'Hej på dig Kinke'))
.then(() => cl.cloudStoreTextToFile('enrollments.STUDENTS.DM1578VT152.1480494800009.csv', 'test', 'Hej på dig lane'))
.then(() => cl.cloudStoreTextToFile('enrollments.STUDENTS.DM1578VT152.1480494800010.csv', 'test', 'Hej på dig koff'))
.then(() => console.log('\n (2) Passed........\n'))
.then(() => console.log('\nlisting files in conainer test again'))
.then(() => cl.cloudListFile('test'))
.then(() => console.log('\n (3) Passed........\n'))
.then(() => console.log('\nTesting missing argument list in _storeTexttoFileAzure'))
.then(() => cl.cloudStoreTextToFile('', 'test', 'Hej på dig ole'))
.catch(error => console.log('In Error: ', error))
.then(() => cl.cloudStoreTextToFile('enrollments.STUDENTS.DM1578VT152.1480494800011.csv', '', 'Hej på dig dole'))
.catch(error => console.log('In Error: ', error))
.then(() => console.log('\n (4) Passed........\n'))
.then(() => console.log('\nRetriving 6 files from Azure to CSV catalog'))
.then(() => cl.cloudgetFile('enrollments.STUDENTS.DM1578VT152.1480494800005.csv', 'test', './AZURETEST/'))
.then(() => cl.cloudgetFile('enrollments.STUDENTS.DM1578VT152.1480494800006.csv', 'test', './AZURETEST/'))
.then(() => cl.cloudgetFile('enrollments.STUDENTS.DM1578VT152.1480494800007.csv', 'test', './AZURETEST/'))
.then(() => cl.cloudgetFile('enrollments.STUDENTS.DM1578VT152.1480494800008.csv', 'test', './AZURETEST/'))
.then(() => cl.cloudgetFile('enrollments.STUDENTS.DM1578VT152.1480494800009.csv', 'test', './AZURETEST/'))
.then(() => cl.cloudgetFile('enrollments.STUDENTS.DM1578VT152.1480494800010.csv', 'test', './AZURETEST/'))
.then(() => console.log('\n (5) Passed........\n'))
.then(() => cl.cloudDeleteFilesBeforeDate(new Date(), 'test',3))
.then(() => cl.cloudListFile('test'))
.then(() => cl.cloudListFile('test'))
.then(() => console.log('\n (6) Passed........\n'))
.then(() => console.log('\nCopy a file to Azure...'))
.then(() => cl.cloudStore('./AZURETEST/enrollments.STUDENTS.DM1578VT152.1480494800005.csv', 'test'))
.then(() => cl.cloudListFile('test'))
.then(() => console.log('\n (7) Passed........\n'))
.then(() => cl.cloudDelFile('./AZURETEST/enrollments.STUDENTS.DM1578VT152.1480494800005.csv', 'test',3))
.then(() => cl.cloudListFile('test'))
.then(() => console.log('\n (8) Passed........\n'))
.then(() => Promise.resolve(true))
.catch(error => console.log(error))
}

_test()
.then(status => {
  if (status === true) {
    console.log('TEST IS OK')
  } else {
    console.error('TEST IS NOT OK,FAILED')
  }
})

module.exports = {test: _test}
