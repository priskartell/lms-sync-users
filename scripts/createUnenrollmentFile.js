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
    type: 'string',
    default: '8779~66Y8d1yIlORRWAZh7TTc3cgUMVtV92Tm9rYaj36UIsSzT1yTAcSiLsaxhwIPsIy0'
  })

  const canvasApi = new CanvasApi(apiUrl, apiKey)
  // TODO: recurse!
  try {
    csvFile.writeLine(['course_id','user_id','role','status'], 'csv/unenrollObservers.csv')
    const courses = await canvasApi.requestUrl('accounts/1/courses/')
    for (let course of courses) {
      console.log(course)
      const enrollments = await canvasApi.requestUrl(`courses/${course.id}/enrollments?type[]=ObserverEnrollment`)
      console.log(enrollments)
    }
  } catch (err) {
    console.error(err)
  }
}
createFile()
