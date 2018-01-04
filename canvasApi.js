const config = require('./config')
const logger = require('./server/logging')
const CanvasApi = require('kth-canvas-api')
const apiUrl = config.canvas.apiUrl || config.canvas.apiUrl

console.log('using canvas api at:', apiUrl)

const canvasApi = new CanvasApi(apiUrl, process.env.CANVAS_API_KEY || config.canvas.apiKey)

canvasApi.logger = logger

module.exports = canvasApi
