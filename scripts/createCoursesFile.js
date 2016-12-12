const rp = require('request-promise')
const Promise = require('bluebird') // use bluebird to get a little more promise functions then the standard Promise AP

rp({
  url: 'https://www.kth.se/api/kopps/v2/departments.sv.json',
  method: 'GET',
  json: true,
  headers: {
    'content-type': 'application/json'
  }
})
    .then(departments => Promise.map(departments, dep => rp({
      url: `https://www.kth.se/api/kopps/v2/courses/${dep.code}.json`,
      method: 'GET',
      json: true,
      headers: {
        'content-type': 'application/json'
      }
    })
    ))
    // .then(coursesPerDepartment => coursesPerDepartment.forEach(dep => coursesForSchool.push(...dep.courses)))
