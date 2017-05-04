'use strict'
const config = require('./server/init/configuration')
const app = require('kth-node-server')
const azure = require('./azureStorage')
const log = require('./server/init/logging')

if (process.env['NODE_ENV'] === 'referens') {
  log.info('setting debug flag for amqp')
  process.env['DEBUG'] = 'amqp*'
}

//
azure.cloudConnect()
app.start()
const consumeMessages = require('./messages/consumeMessages')
consumeMessages.start()

const systemRoutes = require('./server/systemroutes')
app.use(config.full.proxyPrefixPath.uri, systemRoutes)
