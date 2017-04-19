const config = require('./server/init/configuration')
const logger = require('kth-node-log')
const CanvasApi = require('kth-canvas-api')
const apiUrl = config.secure.canvas.apiUrl || config.full.canvas.apiUrl

console.log('using canvas api at:', apiUrl)

const canvasApi = new CanvasApi(apiUrl, config.secure.canvas.apiKey)
console.log(canvasApi.createCourse)
canvasApi.logger = logger

//
module.exports = canvasApi
