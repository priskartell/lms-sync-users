const {createLine} = require('../csvFile')
const log = require('../server/init/logging')
const azureStorage = require('../azureStorage')

module.exports = function createCsvFile (msg, sisCourseCodes, csvDir, csvVol) {
  // Make sure that sisCourseCodes is an array, which makes the rest of this function simpler
  if (!Array.isArray(sisCourseCodes)) {
    sisCourseCodes = [sisCourseCodes]
  }

  let msgtype = msg._desc.userType
  let csvFileName = `enrollments.${msgtype}.${sisCourseCodes[0]}.${Date.now()}.csv`
  let header = createLine(['section_id', 'user_id', 'role', 'status'])

  // create one line per sisCourseId, per user. One user can be enrolled to multiple courses, for instance if this is re-registered students
  function oneLinePerSisCourseId (userId) {
    return sisCourseCodes.map(sisCourseId => createLine([sisCourseId, userId, msgtype, 'active'])).join('')
  }

  const body = msg.member.map(oneLinePerSisCourseId)
  const csvData = [...header, ...body].join('')
  log.info('created csv content', csvData)
  return azureStorage.cloudStoreTextToFile(csvFileName, csvVol, csvData)
  .then(() => azureStorage.cloudgetFile(csvFileName, csvVol, csvDir))
  .then(result => {
    log.info(result)
    return {csvContent: csvData, name: csvDir + result.name}
  })
}
