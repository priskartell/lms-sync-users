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

function getUgGroupKey (sisId) {
    // ugKey: ladok2.kurser.KD.1070.omregistrerade_20171'
    // courseObjs: "sis_course_id": "HH1802VT171"
  if (sisId === null || sisId === undefined) {
    return
  }
  sisCourseId = sisId
  const termSeason = term[sisId.substring(6, 8)]
  const ugKey = `ladok2.kurser.${sisId.substring(0, 2)}.${sisId.substring(2, 6)}.omregistrerade_20${sisId.substring(8, 10)}${termSeason}`
  return ldap.searchGroup(`(&(objectClass=group)(CN=${ugKey}))`)
    .then(ldap.getUsersForMembers)
    .then(members => Promise.mapSeries(members, (member) => csvFile.writeLine([sisCourseId, member.ugKthid, 'student', 'active'], fileName)))
}

const canvasApi = require('../canvasApi.js')
ldap.bindLdapClient()
.then(deleteFile)
.then(() => csvFile.writeLine(columns, fileName))
.then(canvasApi.listCourses)
.then(courseObjs => Promise.mapSeries(courseObjs, (cO) => getUgGroupKey(cO.sis_course_id)))
.catch(e => console.log('error', JSON.stringify(e, null, 4)))
.finally(ldap.unbind)

function deleteFile () {
  return fs.unlinkAsync(fileName)
      .catch(e => console.log("couldn't delete file. It probably doesn't exist. This is fine, let's continue"))
}
