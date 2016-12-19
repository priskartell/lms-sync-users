'use strict'

const memwatch = require('memwatch-next')
const log = require('./server/init/logging')

function watch () {
  memwatch.on('leak', function (info) {
    log.warn('Memory leak detected: ', info)
  })
}

module.exports = {
  watch
}
