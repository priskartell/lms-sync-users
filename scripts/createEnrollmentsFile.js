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

const constants = {
  term: '2017:1',
  period: '3'
}

const fileName = `csv/enrollments-${constants.term}-${constants.period}.csv`
const coursesFileName = `csv/courses-${constants.term}-${constants.period}.csv`

const columns = [
  'course_id',
  'user_id',
  'role',
  'status'
]

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

function writeUsersForCourse ([sisCourseId, courseCode, name]) {
  function writeUser (user, role) {
    return csvFile.writeLine([sisCourseId, user.ugKthid, role, 'active'], fileName)
  }

  console.log('writing users for course', courseCode)

  return Promise.map(['teachers', 'assistants', 'courseresponsible'], type => {
    const courseInitials = courseCode.substring(0, 2)
    const startTerm = constants.term.replace(':', '')
    const roundId = sisCourseId.substring(sisCourseId.length - 1, sisCourseId.length)

    return clientAsync.searchAsync('OU=UG,DC=ug,DC=kth,DC=se', {
      scope: 'sub',
      filter: `(&(objectClass=group)(CN=edu.courses.${courseInitials}.${courseCode}.${startTerm}.${roundId}.${type}))`,
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
    .then(([teachers, assistants, courseresponsible]) => Promise.all([
      Promise.map(teachers, user => writeUser(user, 'teacher')),
      Promise.map(courseresponsible, user => writeUser(user, 'Course Responsible')),
      Promise.map(assistants, user => writeUser(user, 'ta'))
    ])
    )
}

fs.unlinkAsync(fileName)
    .catch(e => console.log('couldnt delete file. It probably doesnt exist.', e.message))
    .then(() => clientAsync.bindAsync(config.secure.ldap.bind.username, config.secure.ldap.bind.password))
    .then(() => csvFile.writeLine(columns, fileName))
    .then(() => fs.readFileAsync(coursesFileName, 'utf8'))
    .then(fileContentStr => fileContentStr.split('\n'))
    .then(lines => lines.splice(1, lines.length - 2)) // first line is columns, last is new empty line
    .then(lines => lines.map(line => line.split(','))) // split into values per column
    .then(linesArrays => Promise.mapSeries(linesArrays, writeUsersForCourse))
    .catch(e => console.error(e))
    .finally(() => clientAsync.unbindAsync())
