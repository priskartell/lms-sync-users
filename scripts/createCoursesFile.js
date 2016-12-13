const rp = require('request-promise')
const Promise = require('bluebird') // use bluebird to get a little more promise functions then the standard Promise AP
const parseString = Promise.promisify(require('xml2js').parseString)
const {groupBy} = require('lodash')

const constants = {
  term: '2017:1',
  period: '3'
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

/***
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

// Start executing

get(`http://www.kth.se/api/kopps/v1/courseRounds/${constants.term}`)
.then(parseString)
.then(extractRelevantData)
.then(courseRounds => filterCoursesByCount(courseRounds, courses => courses.length === 1))
.then(addPeriods)
.then(coursesWithPeriods => coursesWithPeriods.filter(({periods}) => periods && periods.find(({number}) => number === constants.period)))
.then(coursesWithPeriods => coursesWithPeriods.map(courseWithPeriods => courseWithPeriods.round.courseCode))
.then(arg => console.log(JSON.stringify(arg)))
.catch(e => console.error(e))
