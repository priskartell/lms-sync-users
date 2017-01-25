const {createLine} = require('../csvFile')
const log = require('../server/init/logging')
const azureStorage = require('../azureStorage')

module.exports = function createCsvFile (msg, sisCourseCode, csvDir, csvVol) {
  let msgtype = msg._desc.userType
  let csvFileName = `enrollments.${msgtype}.${sisCourseCode}.${Date.now()}.csv`
  let header = createLine(['course_id','user_id','role','status'])

  const body = msg.member.map(userId => createLine([sisCourseCode,userId,msgtype,'active']))
  const csvData = [...header,...body].join('')

  return azureStorage.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(() => azureStorage.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => {
    log.info(result); return {csvContent: csvData, csvFileName: csvDir + result.name} })
  .catch(error => { log.error(error); return Promise.reject(error) })
}
