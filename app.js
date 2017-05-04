'use strict'
const config = require('./server/init/configuration')
const app = require('kth-node-server')
const azure = require('./azureStorage')
const log = require('./server/init/logging')

log.info('NODE_ENV:', process.env['NODE_ENV'])
if (process.env['NODE_ENV'] === 'ref') {
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
