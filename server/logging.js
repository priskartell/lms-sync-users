const packageFile = require('../package.json')
const bunyan = require('bunyan')
require('dotenv').config()

function init (extraConfiguration) {
  const logConf = {
    name: 'node-logger',
    app: packageFile.name,
    level: configuration.log.level,
    src: configuration.log.src,
    ...extraConfiguration
  }
  return bunyan.createLogger(logConf)
}

const configuration = {
  log: {
    level: process.env.LOG_LEVEL,
    src: process.env.LOG_SRC
  }
}

// Use 'let' so we can create other instances instead of this one
let logger = init()

/*
Wrap Bunyans log functions so we
can create new Bunyan instances without the calling code having to bother
about which instance to use, but the 'src' configuration logs the calling code,
instead of logging lines in this file
*/
module.exports = {
  init (extraConfiguration) {
    logger.trace('initializing log with settings', extraConfiguration)
    logger = init(extraConfiguration)
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
