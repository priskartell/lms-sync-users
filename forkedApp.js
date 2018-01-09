const consumeMessages = require('./messages/consumeMessages')
const app = require('kth-node-server')
const systemRoutes = require('./server/systemroutes')
const config = require('./config')
const log = require('./server/logging')

consumeMessages.onDetached = function (msg) {
  log.info('On detached: restart process')
  process.send({action: 'restart'})
}

// This is a temporary fix to make sure that the ref server won't run with the
// production settings. It can safely be removed once we only use docker.
if (config.dontRun) {
  log.info('dontRun is set, skip consuming messages')
} else {
  consumeMessages.start()
}

app.use(config.proxyPrefixPath.uri, systemRoutes)
app.start({logger:log})
