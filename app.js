const consumeMessages = require('./messages/consumeMessages')
const app = require('kth-node-server')
const systemRoutes = require('./server/systemroutes')
const log = require('./server/logging')
require('dotenv').config()

consumeMessages.start()

app.use(process.env.PROXY_PREFIX_PATH, systemRoutes)

// also serve the same urls without the /api prefix. TODO: this can be removed once the old, inprem servers has been removed
app.use('/api' + process.env.PROXY_PREFIX_PATH, systemRoutes)
app.start({ logger: log })
