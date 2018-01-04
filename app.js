'use strict'
const { fork } = require('child_process')
const log = require('./server/logging')

function start () {
  let forked = fork('./forkedApp')

  forked.send({ action: 'start' })

  forked.on('message', (msg) => {
    if (msg.action === 'restart') {
      log.info('Kill the process and restart it.')
      forked.kill()
        // Then start a new fork
      start()
    }
  })
}

start()
