const logger = require('kth-node-log')
const term = require('kth-canvas-utilities/terms')
const ldap = require('./ldapUtilities.js')
const Promise = require('bluebird')
const csvFile = require('../csvFile.js')
const fileName = 'csv/REREG.csv'
const fs = Promise.promisifyAll(require('fs'))

logger.init()
let sisCourseId
const columns = [
  'course_id',
  'user_id',
  'role',
  'status'
]

const canvasApi = require('../canvasApi.js')
ldap.bindLdapClient()
.then(deleteFile)
.then(() => csvFile.writeLine(columns, fileName))
// canvasApi.listCourses().then(courses => console.log('courses', JSON.stringify(courses, null, 4)))
.then(() => canvasApi.getCourse('HH1802VT171'))
.then(({sis_course_id}) => {
  // ladok2.kurser.KD.1070.omregistrerade_20171'
  // "sis_course_id": "HH1802VT171"
  sisCourseId = sis_course_id
  const termSeason = term[sis_course_id.substring(6, 8)]
  const ugKey = `ladok2.kurser.${sis_course_id.substring(0, 2)}.${sis_course_id.substring(2, 6)}.omregistrerade_20${sis_course_id.substring(8, 10)}${termSeason}`
  console.log('ugKey', JSON.stringify(ugKey, null, 4))
  return ugKey
})
.then(ugKey => ldap.searchGroup(`(&(objectClass=group)(CN=${ugKey}))`))
.then(ldap.getUsersForMembers)
.then(members => Promise.mapSeries(members, (member) => csvFile.writeLine([sisCourseId, member.ugKthid, 'student', 'active'], fileName)))
.then(ldap.unbind)

function deleteFile () {
  return fs.unlinkAsync(fileName)
      .catch(e => console.log("couldn't delete file. It probably doesn't exist. This is fine, let's continue"))
}
