const rp = require('request-promise')
const Promise = require('bluebird') // use bluebird to get a little more promise functions then the standard Promise AP
const parseString = Promise.promisify(require('xml2js').parseString)
const _ = require('lodash');

function filterCoursesByCount(courseRounds, filterFn){
  const courseRoundsGrouped = _.groupBy(courseRounds, courseRound=>courseRound.courseCode)

  return Object.getOwnPropertyNames(courseRoundsGrouped)
  .map(name => courseRoundsGrouped[name])
  .filter(filterFn)
  .map(arr => arr[0].courseCode)
}

rp({
  url: 'http://www.kth.se/api/kopps/v1/courseRounds/2017:1',
  method: 'GET',
  json: true,
  headers: {
    'content-type': 'application/json'
  }
})
.then(parseString)
.then(courseRounds => courseRounds.courseRoundList.courseRound)
.then(courseRounds => courseRounds.map(round => round.$))
.then(courseRounds => filterCoursesByCount(courseRounds, courses => courses.length > 1))
.then(arg => console.log('arg', JSON.stringify( arg )))
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
