const config = require('./server/init/configuration')
const logger = require('kth-node-log')
const canvasApi = require('canvas-api')(config.full.canvas.apiUrl, config.secure.canvas.apiKey)

canvasApi.logger = logger

module.exports = canvasApi
