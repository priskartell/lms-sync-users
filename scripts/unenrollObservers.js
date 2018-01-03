const inquirer = require('inquirer')
const CanvasApi = require('kth-canvas-api')
process.env['NODE_ENV'] = 'production'
const csvFile = require('../csvFile')
require('colors')
async function createFile () {
  const {api} = await inquirer.prompt(
    {
      message: 'Vilken miljö?',
      name: 'api',
      choices: [
        {name: 'test', value: {apiUrl:'https://kth.test.instructure.com/api/v1', roleId:59}},
        {name: 'prod', value: {apiUrl:'https://kth.instructure.com/api/v1', roleId:25}},
        {name: 'beta', value: {apiUrl:'https://kth.beta.instructure.com/api/v1', roleId:25}}
      ],
      type: 'list'
    })
  const {apiUrl, roleId} = api

  const {apiKey} = await inquirer.prompt({
    message: 'Klistra in api nyckel till Canvas här',
    name: 'apiKey',
    type: 'string'
  })

  const canvasApi = new CanvasApi(apiUrl, apiKey)
  canvasApi.logger = {info () {
    for (let arg of arguments) {
      console.log(arg.yellow)
    }
  }}
  try {
    const sectionFileName = 'csv/unenrollObserversSections.csv'
    const coursesFileName = 'csv/unenrollObserversCourses.csv'

    await csvFile.writeLine(['section_id', 'user_id', 'role', 'status'], sectionFileName)
    await csvFile.writeLine(['course_id', 'user_id', 'role', 'status'], coursesFileName)

    // const courses = await canvasApi.recursePages(`${apiUrl}/accounts/1/courses?per_page=100`)
    const courses = [
      // { id: 17,
      // name: 'Lasse Wingård sandbox'},
      // { id: 2221,
      //   name: 'LT1018 VT17-1 Ämnesdidaktik'},
      // { id: 2413,
      //   name: 'II2202 HT17-1 Research Methodology and Scientific Writing'},
      { id: 2414,
        name: 'II2202 TIVNM HT17-2 Research Methodology and Scientific Writing'}
      // { id: 2858,
      //   name: 'KH0023 TBASD HT17-1 Kemi för basår I'},
      // { id: 2875,
      //   name: 'KH0022/KH0025 HT17/VT18 Fysik för basår'},
      // { id: 3110,
      //   name: 'A11P1B HT17-1 Arkitekturprojekt 1:1 Sammansättning, geometri, skala'}
    ]

    // List courses with old role
    for (let course of courses) {
      const enrollments = await canvasApi.recursePages(`${apiUrl}/courses/${course.id}/enrollments?role[]=Applied%20pending%20registration%20(Observer)&per_page=100`)
      if (enrollments.length) {
        console.log('found antagen in course'.red, course.id)
      }
    }

    for (let course of courses) {
      try {
        const enrollments = await canvasApi.recursePages(`${apiUrl}/courses/${course.id}/enrollments?role[]=Applied%20pending%20registration%20(Observer)&per_page=100`)
        for (let enrollment of enrollments) {
          console.log('Enroll the user with the new role (25) instead')
          const newEnrollment = {
            enrollment: {
              user_id: enrollment.user_id,
              role_id:roleId
            }
          }

          canvasApi.requestUrl(`/sections/${enrollment.course_section_id}/enrollments`, 'POST', newEnrollment)

          console.log('TODO: Unenroll the user with the old role (21)')

        }
      } catch (e) {
        console.log('an error occured, continue', e)
      }
    }
    console.log('Done.'.green)
  } catch (err) {
    console.error(err)
  }
}
createFile()
