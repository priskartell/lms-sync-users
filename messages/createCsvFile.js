const {writeLine} = require('../csvFile')
const config = require('../server/init/configuration')
const Promise = require('bluebird')

module.exports = function createCsvFile (msg, sisCourseCodes, csvDir, csvVol) {
  let userType = msg._desc.userType

  const fileName = `${config.full.localFile.csvDir}enrollments.${userType}.${sisCourseCodes[0]}.${Date.now()}.csv`
  // Make sure that sisCourseCodes is an array, which makes the rest of this function simpler
  if (!Array.isArray(sisCourseCodes)) {
    sisCourseCodes = [sisCourseCodes]
  }

  // create one line per sisCourseId, per user. One user can be enrolled to multiple courses, for instance if this is re-registered students
  function oneLinePerSisCourseId (userId) {
    return sisCourseCodes.forEach(sisCourseId => writeLine([sisCourseId, userId, userType, 'active'], fileName))
  }

  return writeLine(['section_id', 'user_id', 'role', 'status'], fileName)
  .then(() => Promise.map(msg.member, oneLinePerSisCourseId))
  .then(() => { return {name: fileName} })
}
