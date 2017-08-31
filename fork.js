
const consumeMessages = require('./messages/consumeMessages')
const app = require('kth-node-server')
const systemRoutes = require('../server/systemroutes')
const config = require('./server/init/configuration')
const log = require('./server/init/logging')

consumeMessages.onDetached = function (msg) {
  log.info('On detached: restart process')
  process.send({action: 'restart'})
}

consumeMessages.start()

app.use(config.full.proxyPrefixPath.uri, systemRoutes)
app.start()
