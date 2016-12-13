const rp = require('request-promise')
const Promise = require('bluebird') // use bluebird to get a little more promise functions then the standard Promise AP
const parseString = Promise.promisify(require('xml2js').parseString)

rp({
  url: 'http://www.kth.se/api/kopps/v1/courseRounds/2017:2',
  method: 'GET',
  json: true,
  headers: {
    'content-type': 'application/json'
  }
})
.then(parseString)
.then(courseRounds => courseRounds.courseRoundList.courseRound)
.then(courseRounds => courseRounds.map(round => round.$))
.then(arg => console.log('arg', JSON.stringify( arg[0] )))
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
