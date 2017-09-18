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

    const allSisImports = await canvasApi.recursePages(`${process.env.CANVAS_API_URL}/accounts/1/sis_imports?created_since=${from}`)
    console.log(JSON.stringify(allSisImports, null, 4))

    const flattenedSisImports = allSisImports.reduce((a, b) => {
      a.push(...b.sis_imports)
      return a
    }, [])

    console.log(flattenedSisImports)
      // const canvasUsers = await canvasApi.recursePages('/accounts/1/sis_imports?created_since=2017-09-13T06:30:10.278Z')
      // const usersWithoutSisId = canvasUsers.filter(u => !u.sis_user_id)
      // console.log(JSON.stringify(usersWithoutSisId, null, 4))
  } catch (e) {
    console.error(e)
  }
}
listErrors()
