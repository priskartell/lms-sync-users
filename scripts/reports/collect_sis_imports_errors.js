process.env['NODE_ENV'] = 'production'
require('colors')
const CanvasApi = require('kth-canvas-api')
const inquirer = require('inquirer')
const moment = require('moment')

async function listErrors () {
  try {
    const {apiUrl} = await inquirer.prompt(
      {
        message: 'Vilken miljö?',
        name: 'apiUrl',
        choices: [
          {name: 'prod', value: 'https://kth.instructure.com/api/v1'},
          {name: 'test', value: 'https://kth.test.instructure.com/api/v1'},
          {name: 'beta', value: 'https://kth.beta.instructure.com/api/v1'}
        ],
        type: 'list'
      })

    const {apiKey} = await inquirer.prompt({
      message: 'Pasta in api nyckel här',
      name: 'apiKey',
      type: 'string'
    })

    const canvasApi = new CanvasApi(apiUrl, apiKey)

    const {numOfDays} = await inquirer.prompt({
      message: 'Hur många dagar bakåt?',
      name: 'numOfDays',
      type: 'number',
      default: 1
    })

    const from = moment().subtract(numOfDays, 'days').utc().toDate().toISOString()

    const allSisImports = await canvasApi.recursePages(`${apiUrl}/accounts/1/sis_imports?created_since=${from}&per_page=100`)

    const flattenedSisImports = allSisImports
    .reduce((a, b) => a.concat(b.sis_imports), []) // Flatten every page

    const allWarnings = flattenedSisImports
    .map(_import => [...(_import.processing_warnings || []), ...(_import.processing_errors || [])])
    .reduce((a, b) => a.concat(b), [])  // Flatten every warning from every sis_import

    const filteredWarnings = allWarnings
    .filter(([fileName, warning]) => !warning.startsWith('Neither course nor section existed'))
    .filter(([fileName, warning]) => !/There were [\d,]+ more warnings/.test(warning))
    .filter(([fileName, warning]) => !warning.startsWith('An enrollment referenced a non-existent section'))

    console.log('Warnings and errors:'.green)
    console.log(filteredWarnings)
  } catch (e) {
    console.error(e)
  }
}
listErrors()
