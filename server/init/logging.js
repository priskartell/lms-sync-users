'use strict'

const log = require('kth-node-log')
const config = require('./configuration')
const packageFile = require('../../package.json')

const configuration = config.full.logging
const environment = config.env

let logConfiguration = {
  name: packageFile.name,
  app: packageFile.name,
  env: environment,
  level: configuration.log.level,
  console: configuration.console,
  stdout: configuration.stdout,
  src: configuration.log.src
}

const logger = log.init(logConfiguration)
module.exports = logger
