const config = require('./server/init/configuration')
const logger = require('./server/init/logging')
const CanvasApi = require('kth-canvas-api')
const apiUrl = config.secure.canvas.apiUrl || config.full.canvas.apiUrl

console.log('using canvas api at:', apiUrl)

const canvasApi = new CanvasApi(apiUrl, process.env.CANVAS_API_KEY || config.secure.canvas.apiKey)

canvasApi.logger = logger

module.exports = canvasApi
