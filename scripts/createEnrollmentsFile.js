const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const csvFile = require('../csvFile')
const ldap = require('./ldapUtilities.js')
require('colors')

const termin = process.env.TERMIN
const period = process.env.PERIOD

const fileName = `csv/enrollments-${termin}-${period}.csv`
const coursesFileName = `csv/courses-${termin}-${period}.csv`
const columns = [
  'course_id',
  'user_id',
  'role',
  'status'
]

/*
* Fetch the members for the examinator group for this course.
* Return a similar array as the in-parameter, with the examinators added
*/
function addExaminators ([teachersMembers, assistantsMembers, courseresponsibleMembers], courseCode) {
  const courseInitials = courseCode.substring(0, 2)
  return ldap.searchGroup(`(&(objectClass=group)(CN=edu.courses.${courseInitials}.${courseCode}.examiner))`)
  .then(examinatorMembers => {
    return [teachersMembers, assistantsMembers, courseresponsibleMembers, examinatorMembers]
  })
}

/*
* For the given course, fetch all user types from UG and add write all of them to the enrollments file
*/
function writeUsersForCourse ([sisCourseId, courseCode, name]) {
  console.log('writing users for course', courseCode)

  function writeUsers (users, role) {
    return Promise.map(users, user => csvFile.writeLine([sisCourseId, user.ugKthid, role, 'active'], fileName))
  }

  return Promise.map(['teachers', 'assistants', 'courseresponsible'], type => {
    const courseInitials = courseCode.substring(0, 2)
    const startTerm = termin.replace(':', '')
    const roundId = sisCourseId.substring(sisCourseId.length - 1, sisCourseId.length)

    return ldap.searchGroup(`(&(objectClass=group)(CN=edu.courses.${courseInitials}.${courseCode}.${startTerm}.${roundId}.${type}))`)
  })
  .then(arrayOfMembers => addExaminators(arrayOfMembers, courseCode))
  .then(arrayOfMembers => Promise.map(arrayOfMembers, ldap.getUsersForMembers))
  .then(([teachers, assistants, courseresponsible, examinators]) => Promise.all([
    writeUsers(teachers, 'teacher'),
    writeUsers(courseresponsible, 'Course Responsible'),
    writeUsers(assistants, 'ta'),
    writeUsers(examinators, 'Examiner')
  ])
  )
}

/*
* Reads the courses file and splits it's content into an array of arrays.
* One array per line, containing one array per column
*/
function getAllCoursesAsLinesArrays () {
  return fs.readFileAsync(coursesFileName, 'utf8')
  .catch(e => console.error('Could not read the courses file. Have you run the npm script for creating the courses csv file? '.red, e))
  .then(fileContentStr => fileContentStr.split('\n')) // one string per line
  .then(lines => lines.splice(1, lines.length - 2)) // first line is columns, last is new empty line. Ignore them
  .then(lines => lines.map(line => line.split(','))) // split into values per column
}

function deleteFile () {
  return fs.unlinkAsync(fileName)
      .catch(e => console.log("couldn't delete file. It probably doesn't exist. This is fine, let's continue"))
}

function createFileAndWriteHeadlines () {
  return csvFile.writeLine(columns, fileName)
}

// Run the script
deleteFile()
.then(ldap.bindLdapClient)
.then(createFileAndWriteHeadlines)
.then(getAllCoursesAsLinesArrays)
.then(linesArrays => Promise.mapSeries(linesArrays, writeUsersForCourse)) // write all users for each course to the file
.then(() => console.log('Done!'.green))
.catch(e => console.error(e))
.finally(ldap.unbind)
