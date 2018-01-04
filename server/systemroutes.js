/**
 * System controller for functions such as /about and /monitor
 */
 const canvasApi = require('../canvasApi')
 const rp = require('request-promise')
 const express = require('express')
 const router = express.Router()
 const config = require('./init/configuration')
 const version = require('../config/version')
 const packageFile = require('../package.json')
 const moment = require('moment')
 const [waitAmount, waitUnit] = [10, 'hours']
 const history = require('../messages/history')
 const log = require('../server/init/logging')
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

 function status () {
   const checkCanvasStatus = rp('http://nlxv32btr6v7.statuspage.io/api/v2/status.json')
    .then(JSON.parse)
    .then(data => data.status.indicator === 'none')

   const readAccountInCanvas = canvasApi.getRootAccount()
   let canvasOk, canvasKeyOk

   return checkCanvasStatus
   .then(_canvasOk => { canvasOk = _canvasOk })
   .catch(e => { canvasOk = false })
   .then(() => readAccountInCanvas)
   .then(keyOk => { canvasKeyOk = keyOk })
   .catch(e => { canvasKeyOk = false })
   .then(() => {
     return {canvasOk, canvasKeyOk}
   })
 }

 var _monitor = function (req, res) {
   status().then(({canvasOk, canvasKeyOk}) => {
     res.setHeader('Content-Type', 'text/plain')
     const checkTimeAgainst = moment().subtract(waitAmount, waitUnit)

     const idleTimeOk = history.idleTimeStart.isAfter(checkTimeAgainst)

     log.info(`checking idle time: last time a message was read was: ${history.idleTimeStart}, compare this to now minus some predifined time: ${checkTimeAgainst}`)
     const statusStr = `APPLICATION_STATUS: ${idleTimeOk && canvasKeyOk ? 'OK' : 'ERROR'} ${packageFile.name}-${packageFile.version}-${version.jenkinsBuild}
READ MESSAGE FROM AZURE: ${idleTimeOk ? `OK. The server has waited less then ${waitAmount} ${waitUnit} for a message.` : `ERROR. The server has not received a message in the last ${waitAmount} ${waitUnit}`}
CANVAS: ${canvasOk ? 'OK' : 'Canvas is down'}
CANVASKEY: ${canvasKeyOk ? 'OK' : 'Invalid access token (in case if CANVAS is "OK")'}
  `
    log.info('monitor page displays:', statusStr)
     res.send(statusStr)
   })
 }

 router.get('/_monitor', _monitor)
 router.get('/_monitor_all', _monitor)

 router.get('/_monitor_core', _monitor)
 router.get('/_about', _about)

 router.get('/', function (req, res) {
   res.redirect(`${config.full.proxyPrefixPath.uri}/_monitor`)
 })

 module.exports = router
