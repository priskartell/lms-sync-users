const {createLine} = require('../csvFile')
const log = require('../server/init/logging')
const azureStorage = require('../azureStorage')

module.exports = function createCsvFile (msg, sisCourseCode, csvDir, csvVol) {
  const timeStamp = Date.now()
  let header = 'course_id,user_id,role,status\n'
  let msgtype = msg._desc.userType
  let csvFileName = `enrollments.${msgtype}.${sisCourseCode}.${timeStamp}.csv`
  let csvString = ''

  if (msg.member && msg.member.length > 0) {
    let csvArray = msg.member.map(user => {
      return {
        course_id: sisCourseCode,
        user_id: user,
        role: msgtype,
        status: 'active'
      }
    })
    csvArray.forEach(csvRow => {
      csvString = csvString + `${csvRow.course_id},${csvRow.user_id},${csvRow.role},${csvRow.status}
`
    })
  }

  let csvData = header + csvString
  return azureStorage.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(() => azureStorage.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => {
    log.info(result); return {csvContent: csvData, csvFileName: csvDir + result.name} })
  .catch(error => { log.error(error); return Promise.reject(error) })
}
