const rp = require('request-promise')
const Promise = require('bluebird') // use bluebird to get a little more promise functions then the standard Promise AP
const parseString = Promise.promisify(require('xml2js').parseString)
const {groupBy} = require('lodash')
const config = require('../server/init/configuration')
const canvasUtilities = require('kth-canvas-utilities')
canvasUtilities.init(config.full.canvas.apiUrl, config.secure.canvas.apiKey)
const {getCourseAndCourseRoundFromKopps, createCanvasCourseObject} = canvasUtilities
const csvFile = require('../csvFile')
const fs = require('fs')

const constants = {
  term: '2017:1',
  period: '3'
}

const fileName = `courses-${constants.term}-${constants.period}.csv`

try {
  fs.unlinkSync(fileName)
} catch (e) {
  console.log('couldnt delete file. It probably doesnt exist.', e)
}

function get (url) {
  console.log(url)
  return rp({
    url,
    method: 'GET',
    json: true,
    headers: {
      'content-type': 'application/json'
    }
  })
}

/** *
* return example:
* {"round":{"courseCode":"MJ2244","startTerm":"20171","roundId":"1","xmlns":""},"periods":[{"term":"20171","number":"3"}]}
*/
function addPeriods (courseRounds) {
  function addInfoForCourseRound ([round]) {
    return get(`http://www.kth.se/api/kopps/v1/course/${round.courseCode}/round/${constants.term}/${round.roundId}`)
    .then(parseString)
    .then(roundInfo => {
      const periods = roundInfo.courseRound.periods && roundInfo.courseRound.periods[0].period.map(period => period.$)
      return {round, periods}
    })
  }

  return Promise.map(courseRounds, addInfoForCourseRound)
}

function filterCoursesByCount (courseRounds, filterFn) {
  const courseRoundsGrouped = groupBy(courseRounds, courseRound => courseRound.courseCode)

  return Object.getOwnPropertyNames(courseRoundsGrouped)
  .map(name => courseRoundsGrouped[name])
  .filter(filterFn)
}

function extractRelevantData (courseRounds) {
  return courseRounds.courseRoundList.courseRound.map(round => round.$)
}

function buildCanvasCourseObjects (courseRounds) {
  return Promise.map(courseRounds, ({round}) => {
    // Add a ':' between year and term
    const position = 4
    const startTerm = [round.startTerm.slice(0, position), ':', round.startTerm.slice(position)].join('')
    return getCourseAndCourseRoundFromKopps({courseCode: round.courseCode, startTerm, round: round.roundId})
  })
  .then(coursesAndCourseRounds => Promise.map(coursesAndCourseRounds, createCanvasCourseObject))
}

function createCSVContent (canvasCourseObjects) {
//   course_id 	text 	Required field. A unique identifier used to reference courses in the enrollments data. This identifier must not change for the account, and must be globally unique. In the user interface, this is called the SIS ID.
// short_name 	text 	Required field. A short name for the course
// long_name 	text 	Required field. A long name for the course. (This can be the same as the short name, but if both are available, it will provide a better user experience to provide both.)
// account_id 	text 	The account identifier from accounts.csv, if none is specified the course will be attached to the root account
// term_id 	text 	The term identifier from terms.csv, if no term_id is specified the default term for the account will be used
// status 	enum 	Required field. active, deleted, completed
// start_date 	date 	The course start date. The format should be in ISO 8601: YYYY-MM-DDTHH:MM:SSZ
// end_date 	date 	The course end date. The format should be in ISO 8601: YYYY-MM-DDTHH:MM:SSZ
// course_format 	enum 	on_campus, online, blended

/*
"course": {
      "course": {
        "name": "Nonequilibrium Statistical Mechanics VT17",
        "course_code": "SI2520",
        "sis_course_id": "SI2520VT171",
        "start_at": "2017-01-16T10:34:52.470Z"
      }
    },
    "subAccountId": 28

*/
  const columns = ['course_id', 'short_name', 'long_name', ' start_date', 'account_id', 'status']
  // console.log(JSON.stringify(canvasCourseObjects[0], null, 4))
  return csvFile.writeLine(columns, fileName)
  .then(() => Promise.map(canvasCourseObjects, ({course, subAccountId}) => csvFile.writeLine([course.course.sis_course_id, course.course.name], fileName)))
}

// Start executing

get(`http://www.kth.se/api/kopps/v1/courseRounds/${constants.term}`)
.then(parseString)
.then(extractRelevantData)
.then(courseRounds => filterCoursesByCount(courseRounds, courses => courses.length === 1))
.then(addPeriods)
.then(coursesWithPeriods => coursesWithPeriods.filter(({periods}) => periods && periods.find(({number}) => number === constants.period)))

.then(coursesWithPeriods => [coursesWithPeriods[0]])

.then(buildCanvasCourseObjects)
.then(createCSVContent)
.then(arg => console.log(JSON.stringify(arg, null, 2)))
.catch(e => console.error(e))
