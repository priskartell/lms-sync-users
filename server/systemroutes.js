/**
 * System controller for functions such as /about and /monitor
 */
const canvasApi = require('../canvasApi')
const rp = require('request-promise')
const express = require('express')
const router = express.Router()
const packageFile = require('../package.json')
const log = require('../server/logging')
const version = require('../config/version')
const consumeMessages = require('../messages/consumeMessages.js')

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
      return { canvasOk, canvasKeyOk }
    })
}

var _monitor = function (req, res) {
  status().then(({ canvasOk, canvasKeyOk }) => {
    res.setHeader('Content-Type', 'text/plain')

    const isConnectionOpen = consumeMessages.getConnection().is_open()
    const statusStr = [
      `APPLICATION_STATUS: ${isConnectionOpen && canvasKeyOk ? 'OK' : 'ERROR'} ${packageFile.name}-${packageFile.version}-${version.jenkinsBuild}`,
      `CONNECTION TO AZURE ALIVE: ${isConnectionOpen ? `OK. The connection to Azure is alive and well.` : `ERROR. The connection to Azure seems to have been lost.`}`,
      `CANVAS: ${canvasOk ? 'OK' : 'Canvas is down'}`,
      `CANVASKEY: ${canvasKeyOk ? 'OK' : 'Invalid access token (in case if CANVAS is "OK")'}`
    ].join('\n')

    log.info('monitor page displays:', statusStr)
    res.send(statusStr)
  })
}

router.get('/_monitor', _monitor)
router.get('/_monitor_all', _monitor)

router.get('/_monitor_core', _monitor)
router.get('/_about', _about)

router.get('/', function (req, res) {
  res.redirect(`${process.env.PROXY_PREFIX_PATH}/_monitor`)
})

module.exports = router
