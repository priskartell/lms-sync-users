/**
 * System controller for functions such as /about and /monitor
 */
const express = require('express')
const router = express.Router()
const config = require('./init/configuration')
const version = require('../config/version')
const packageFile = require('../package.json')
const moment = require('moment')
const consumeMessages = require('../messages/consumeMessages')
let idleTimeStart = moment()
let lastSuccessfulMessage
/* GET /_about
 * About page
 */
var _about = function (req, res) {
  res.setHeader('Content-Type', 'text/plain')
  res.send(`
    packageFile.name:${packageFile.name}
    packageFile.version:${packageFile.version}
    packageFile.description:${packageFile.description}
    version.gitBranch:${version.gitBranch}
    version.gitCommit:${version.gitCommit}
    version.jenkinsBuild:${version.jenkinsBuild}
    version.dockerName:${version.dockerName}
    version.dockerVersion:${version.dockerVersion}
    version.jenkinsBuildDate:${version.jenkinsBuildDate}`)
}

consumeMessages.eventEmitter.on('processMessageStart', (msg, result) => {
  idleTimeStart = moment()
})

consumeMessages.eventEmitter.on('messageProcessed', (msg, result) => {
  lastSuccessfulMessage = moment()
})

var _monitor = function (req, res) {
  res.setHeader('Content-Type', 'text/plain')

  const isOk = idleTimeStart.isAfter(moment().subtract(10, 'hours'))
  res.send(`
IDLE TIME STARTED: ${idleTimeStart}
LAST SUCCESSFUL MESSAGE SENT TO CANVAS: ${lastSuccessfulMessage || 'never since restarting server'}
APPLICATION_STATUS: ${isOk?'OK':'NOT OK'}
  `)
}

router.get('/_monitor', _monitor)
router.get('/_monitor_all', _monitor)

router.get('/_monitor_core', _monitor)
router.get('/_about', _about)

router.get('/', function (req, res) {
  res.redirect(`${config.full.proxyPrefixPath.uri}/_monitor`)
})

module.exports = router
