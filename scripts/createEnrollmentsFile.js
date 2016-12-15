/*
[
  {
    "course": {
      "course": {
        "name": "VT17-1 Airbreathing Propulsion, Intermediate Course I",
        "course_code": "MJ2244",
        "sis_course_id": "MJ2244VT171",
        "start_at": "2017-01-16T14:18:20.720Z"
      }
    },
    "subAccount": {
      "id": 27,
      "name": "Imported course rounds",
      "workflow_state": "active",
      "parent_account_id": 11,
      "root_account_id": 1,
      "default_storage_quota_mb": 2000,
      "default_user_storage_quota_mb": 50,
      "default_group_storage_quota_mb": 50,
      "default_time_zone": "Europe/Stockholm",
      "sis_account_id": "ITM - Imported course rounds",
      "sis_import_id": null,
      "integration_id": null
    },
    "courseRound": {
      "courseCode": "MJ2244",
      "startTerm": "20171",
      "roundId": "1",
      "startWeek": "2017-03",
      "endWeek": "2017-11",
      "xmlns": "http://www.kth.se/student/kurser"
    }
  }
]

*/
const Promise = require('bluebird')
const ldap = require('ldapjs')
const config = require('../server/init/configuration')
const client = ldap.createClient({
  url: config.secure.ldap.client.url
})
const clientAsync = Promise.promisifyAll(client)

module.exports = function (arrayOfCourseInfo) {
  console.log('todo: query ldap', JSON.stringify(arrayOfCourseInfo, null, 2))
  return client.bindAsync(config.secure.ldap.bind.username, config.secure.ldap.bind.password)
  .then(() => Promise.map(arrayOfCourseInfo, ({course, subAccount, courseRound, shortName}) => {
    console.log('todo do something...')
    return Promise.resolve()
  }))
  .then(() => client.unbindAsync())
}
