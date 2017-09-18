process.env['NODE_ENV'] = 'production'
const CanvasApi = require('kth-canvas-api')
const inquirer = require('inquirer')
const moment = require('moment')
require('dotenv').config()

const canvasApi = new CanvasApi(process.env.CANVAS_API_URL, process.env.CANVAS_API_KEY)

async function listErrors () {
  try {
    const {numOfDays} = await inquirer.prompt({
      message: 'Hur många dagar bakåt?',
      name: 'numOfDays',
      type: 'number',
      default: 1
    })
    console.log(numOfDays)
    const from = moment().subtract(numOfDays, 'days').utc().toDate().toISOString()

    const allSisImports = await canvasApi.recursePages(`${process.env.CANVAS_API_URL}/accounts/1/sis_imports?created_since=${from}&per_page=100`)

    const flattenedSisImports = allSisImports
    .reduce((a, b) => a.concat(b.sis_imports), []) // Flatten every page


    const allWarnings = flattenedSisImports
    .map(_import => [...(_import.processing_warnings || []),...(_import.processing_errors || [])])
    .reduce((a,b)=>a.concat(b),[])  // Flatten every warning from every sis_import

    const filteredWarnings = allWarnings
    .filter(([fileName,warning])=> !warning.startsWith('Neither course nor section existed'))
    .filter(([fileName,warning])=> !/There were [\d\,]+ more warnings/.test(warning))
    .filter(([fileName,warning])=> !warning.startsWith('An enrollment referenced a non-existent section'))

    console.log(filteredWarnings)
  } catch (e) {
    console.error(e)
  }
}
listErrors()
