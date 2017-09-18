process.env['NODE_ENV'] = 'development'
const config = require('../server/init/configuration.js')
const CanvasApi = require('kth-canvas-api')
const canvasApi = new CanvasApi(config.full.canvas.apiUrl, config.secure.canvas.apiKey)

async function listUsersWithoutSisid() {
    const canvasUsers =await canvasApi.listUsers()
    const usersWithoutSisId = canvasUsers.filter(u => !u.sis_user_id)
    console.log(JSON.stringify(usersWithoutSisId, null, 4))
}
listUsersWithoutSisid()
