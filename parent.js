const { fork } = require('child_process')

function connect () {
  let forked = fork('child.js')

  forked.on('message', (msg) => {
    if (msg.event === 'detached') {
      console.log('child is detached!')
      forked.kill()
        // Then start a new fork
      connect()
    }
  })
}

connect()
