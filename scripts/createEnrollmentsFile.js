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
const fs = Promise.promisifyAll(require('fs'))

const config = require('../server/init/configuration')
const client = ldap.createClient({
  url: config.secure.ldap.client.url
})
const clientAsync = Promise.promisifyAll(client)
const attributes = ['ugKthid', 'name']
const csvFile = require('../csvFile')

let fileName

const columns = [
  'course_id',
  'short_name',
  'long_name',
  'start_date',
  'account_id',
  'status']

function writeUsersForCourse ({course, courseRound, constants}) {
  console.log('get users for the course', courseRound.courseCode)
  return Promise.map(['teachers', 'assistants', 'courseresponsible'], type => {
    const courseInitials = courseRound.courseCode.substring(0, 2)
    return clientAsync.searchAsync('OU=UG,DC=ug,DC=kth,DC=se', {
      scope: 'sub',
      filter: `(&(objectClass=group)(CN=edu.courses.${courseInitials}.${courseRound.courseCode}.${courseRound.startTerm}.${courseRound.roundId}.${type}))`,
      timeLimit: 11,
      paged: true
    })
  .then(res => new Promise((resolve, reject) => {
    res.on('searchEntry', ({object}) => resolve(object.member))
    res.on('end', ({object}) => resolve(object && object.member))
    res.on('error', reject)
  }))
  .then(member => {
    // Always use arrays as result
    if (typeof member === 'string') {
      return [member]
    } else {
      return member || []
    }
  })
  })
  .then(arrayOfMembers => Promise.map(arrayOfMembers, getUsersForMembers))
  .then(() => console.log('TODO: write a line!'))
  // .then(([teachers, assistants, courseresponsible]) => {
  //   // console.log(`got ${teachers.length} teachers, ${assistants.length} assistants and ${courseresponsible.length} courseresponsible for course ${courseRound.courseCode}`);
  //   return {sisCourseId: course.course.sis_course_id, users: {teachers, assistants, courseresponsible}}
  // })
}

function getUsersForMembers (members) {
  return Promise.map(members, member => {
    // console.log('get users for member:', member)
    return clientAsync.searchAsync('OU=UG,DC=ug,DC=kth,DC=se', {
      scope: 'sub',
                                // CN=Nenad Glodic (glodic),OU=EMPLOYEES,OU=USERS,OU=UG,DC=ug,DC=kth,DC=se
      filter: `(distinguishedName=${member})`,
      timeLimit: 10,
      paging: true,
      attributes,
      paged: {
        pageSize: 1000,
        pagePause: false
      }
    })
  .then(res => new Promise((resolve, reject) => {
    const users = []
    res.on('searchEntry', ({object}) => users.push(object))
    res.on('end', () => resolve(users))
    res.on('error', reject)
  }))
  })
  .then(userArray => [].concat.apply([], userArray))
}
let constants = {}
module.exports = {
  createFile (arrayOfCourseInfo) {
    fileName = `csv/enrollments-${constants.term}-${constants.period}.csv`
    return fs.unlinkAsync(fileName)
    .catch(e => console.log('couldnt delete file. It probably doesnt exist.', e.message))
    .then(() => clientAsync.bindAsync(config.secure.ldap.bind.username, config.secure.ldap.bind.password))
    .then(() => csvFile.writeLine(columns, fileName))
    .then(() => Promise.map(arrayOfCourseInfo, writeUsersForCourse))
    .finally(() => clientAsync.unbindAsync())
  }
}
