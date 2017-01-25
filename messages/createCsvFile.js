const {createLine} = require('../csvFile')
const log = require('../server/init/logging')
const azureStorage = require('../azureStorage')

module.exports = function createCsvFile (msg, sisCourseCodes, csvDir, csvVol) {
  if (!Array.isArray(sisCourseCodes)) {
    sisCourseCodes = [sisCourseCodes]
  }

  let msgtype = msg._desc.userType
  let csvFileName = `enrollments.${msgtype}.${sisCourseCodes[0]}.${Date.now()}.csv`
  let header = createLine(['course_id', 'user_id', 'role', 'status'])

  function oneLinePerSisCourseId (userId) {
    return sisCourseCodes.map(sisCourseCode => createLine([sisCourseCode, userId, msgtype, 'active'])).join('')
  }

  const body = msg.member.map(oneLinePerSisCourseId)
  const csvData = [...header, ...body].join('')
  log.info('created csv content', csvData)
  return azureStorage.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(() => azureStorage.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => {
    log.info(result)
    return {csvContent: csvData, csvFileName: csvDir + result.name}
  })
}
