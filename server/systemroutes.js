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
  const [waitAmount, waitUnit] = [5, 'seconds']
  const idleTimeOk = idleTimeStart.isAfter(moment().subtract(waitAmount, waitUnit))

  res.send(`
APPLICATION_STATUS: ${idleTimeOk ? 'OK' : 'ERROR'} ${packageFile.name}-${packageFile.version}-${version.jenkinsBuild}
READ MESSAGE: ${idleTimeOk ? `OK. The server has waited less then ${ waitAmount } ${waitUnit} for a message.` : `ERROR. The server has not received a message in ${ waitAmount } ${waitUnit}`}
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
