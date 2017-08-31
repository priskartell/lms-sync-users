'use strict'
const config = require('./server/init/configuration')
const { fork } = require('child_process')
const log = require('./server/init/logging')

function consumeMessages () {
  let forked = fork('./messages/consumeMessages')

  forked.send({ action: 'start' })

  forked.on('message', (msg) => {
    if (msg.action === 'restart') {
      log.info('Kill the process and restart it.')
      forked.kill()
        // Then start a new fork
      consumeMessages()
    }
  })
}

consumeMessages()
