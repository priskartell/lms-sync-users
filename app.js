'use strict'
const { fork } = require('child_process')
const log = require('./server/init/logging')

function start () {
  let forked = fork('./fork')

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
