'use strict'
const config = require('./server/init/configuration')
const app = require('kth-node-server')
const processWatcher = require('./watch')
const logVol = config.secure.azure.logBlobName

processWatcher.cloudWatch(logVol, 'log')
app.start()
const consumeMessages = require('./messages/consumeMessages')
consumeMessages.readMessage()

const systemRoutes = require('./server/systemroutes')
app.use(config.full.proxyPrefixPath.uri, systemRoutes)
