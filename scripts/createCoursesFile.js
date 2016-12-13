const rp = require('request-promise')
const Promise = require('bluebird') // use bluebird to get a little more promise functions then the standard Promise AP
const parseString = Promise.promisify(require('xml2js').parseString)
const _ = require('lodash')

const term = '2017:1'
// const period = '3'

function addPeriods (courseRounds) {
  function addInfoForCourseRound ([round]) {
    return get(`http://www.kth.se/api/kopps/v1/course/${round.courseCode}/round/${term}/${round.roundId}`)
    .then(parseString)
    .then(roundInfo => {
      const periods = roundInfo.courseRound.periods && roundInfo.courseRound.periods[0].period.map(period => period.$)
      return {round, periods}
    })
  }

  return Promise.map(courseRounds, addInfoForCourseRound)
}

function filterCoursesByCount (courseRounds, filterFn) {
  const courseRoundsGrouped = _.groupBy(courseRounds, courseRound => courseRound.courseCode)

  return Object.getOwnPropertyNames(courseRoundsGrouped)
  .map(name => courseRoundsGrouped[name])
  .filter(filterFn)
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

get(`http://www.kth.se/api/kopps/v1/courseRounds/${term}`)
.then(parseString)
.then(courseRounds => courseRounds.courseRoundList.courseRound)
.then(courseRounds => courseRounds.map(round => round.$))
.then(courseRounds => filterCoursesByCount(courseRounds, courses => courses.length === 1))
.then(addPeriods)
.then(arg => console.log('arg', JSON.stringify(arg[0])))
// .then(filterCoursesByPeriod)
.catch(e => console.error(e))
// .then(courseRounds => c)
// .then(arg => console.log('arg', JSON.stringify( arg[0] )))

    // .then(departments => Promise.map(departments, dep => rp({
    //   url: `https://www.kth.se/api/kopps/v2/courses/${dep.code}.json`,
    //   method: 'GET',
    //   json: true,
    //   headers: {
    //     'content-type': 'application/json'
    //   }
    // })
    // ))
    // .then(coursesPerDepartment => coursesPerDepartment.forEach(dep => coursesForSchool.push(...dep.courses)))
