const inquirer = require('inquirer')
const CanvasApi = require('kth-canvas-api')
process.env['NODE_ENV'] = 'production'
const csvFile = require('../csvFile')

async function createFile () {
  const {apiUrl} = await inquirer.prompt(
    {
      message: 'Vilken miljö?',
      name: 'apiUrl',
      choices: [
        {name: 'test', value: 'https://kth.test.instructure.com/api/v1'},
        {name: 'prod', value: 'https://kth.instructure.com/api/v1'},
        {name: 'beta', value: 'https://kth.beta.instructure.com/api/v1'}
      ],
      type: 'list'
    })

  const {apiKey} = await inquirer.prompt({
    message: 'Klistra in api nyckel till Canvas här',
    name: 'apiKey',
    type: 'string'
  })

  const canvasApi = new CanvasApi(apiUrl, apiKey)
  try {
    await csvFile.writeLine(['section_id', 'user_id', 'role', 'status'], 'csv/unenrollObservers.csv')

    const courses = await canvasApi.recursePages(`${apiUrl}/accounts/1/courses?per_page=100`)

    // const courses = await canvasApi.requestUrl(`accounts/1/courses?per_page=100`)
    // const course = courses[0]
    // course.id = 2339

    for (let course of courses) {
      console.log(course)

      const enrollments = await canvasApi.recursePages(`${apiUrl}/courses/${course.id}/enrollments?type[]=ObserverEnrollment&per_page=100`)
      for (enrollment of enrollments) {
        console.log(enrollment)
        if (enrollment.sis_section_id) {
            // TODO Only removing observers from sections. Guess we should also remove from courses?
          await csvFile.writeLine([enrollment.sis_section_id, enrollment.user_id, 'ObserverEnrollment', 'deleted'], 'csv/unenrollObservers.csv')
        }
      }
    }
    console.log('Done. Now upload the sis file to canvas.')
  } catch (err) {
    console.error(err)
  }
}
createFile()
