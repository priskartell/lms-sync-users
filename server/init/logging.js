// 'use strict'

const log = require('kth-node-log')
const config = require('./configuration')
const packageFile = require('../../package.json')

const configuration = config.full.logging
const environment = config.env

const logConfiguration = {
  name: packageFile.name,
  app: packageFile.name,
  env: environment,
  level: configuration.log.level,
  console: configuration.console,
  stdout: configuration.stdout,
  src: configuration.log.src
}

// Use 'let' so we can create other instances instead of this one
let logger = log.init(logConfiguration)

/*
Wrap Bunyans log functions so we
can create new Bunyan instances without the calling code having to bother
about which instance to use
*/
module.exports = {
  init (extraConfiguration) {
    log.trace('initializing log with settings', extraConfiguration)
    logger = log.init(logConfiguration, extraConfiguration)
  },
  get trace () {
    return logger.trace.bind(logger)
  },
  get debug () {
    return logger.debug.bind(logger)
  },
  get info () {
    return logger.info.bind(logger)
  },
  get warn () {
    return logger.warn.bind(logger)
  },
  get error () {
    return logger.error.bind(logger)
  },
  get fatal () {
    return logger.fatal.bind(logger)
  }
}
