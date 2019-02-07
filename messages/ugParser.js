'use strict'

function parseKeyReRegistered (key) {
  // ladok2.kurser.AG.1b9l.omregistrerade_20171
  const regExp = /ladok2.kurser.(\w{2}.\w{4}).omregistrerade_20(\d{2})(\d)/
  const [, courseCodeString, shortYear, termNum] = regExp.exec(key)
  return {
    courseCode: courseCodeString.replace('.', ''),
    shortYear: parseInt(shortYear),
    term: termNum === '1' ? 'VT' : 'HT' }
}

function parseKeyTeacher (key) {
  // edu.courses.AE.AE2302.20162.1.teachers edu.courses.DD.DD1310.20162.1.assistants
  // edu.courses.DD.DD1310.20162.1.courseresponsible
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let courseIn = 2
  let terminIn = 5
  let yearIn = 4
  let ladokIn = 6

  let myRe = /^edu.courses.(\w+).(\w+).(\d\d)(\d\d)(\d).(\d).(\w+)$/g
  let myArray = myRe.exec(key)
  if (myArray != null) {
    course = myArray[courseIn]
    termin = myArray[terminIn] === '1' ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return sisCourseCode
  }
}

function parseKeyStudent (key) {
  // ladok2.kurser.DM.2517.registrerade_20162.1
  let course = null
  let termin = null
  let year = null
  let ladok = null
  let myRe = /^(\w+).(\w+).(\w+).(\w+).(\w+)_(\d\d)(\d\d)(\d).(\d+)/g
  let myArray = myRe.exec(key)
  if (myArray != null) {
    let courseInOne = 3
    let courseInTwo = 4
    let terminIn = 8
    let yearIn = 7
    let ladokIn = 9
    course = myArray[courseInOne] + myArray[courseInTwo]
    termin = myArray[terminIn] === '1' ? 'VT' : 'HT'
    year = myArray[yearIn]
    ladok = myArray[ladokIn]
    let sisCourseCode = course + termin + year + ladok
    return sisCourseCode
  }
}

module.exports = {
  parseKeyTeacher,
  parseKeyStudent,
  parseKeyReRegistered
}
