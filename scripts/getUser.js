process.env['NODE_ENV'] = 'development'
require('kth-node-log').init()
const canvasApi = require('../canvasApi')
canvasApi.getUser('u1znmoik')
.then(arg => console.log(JSON.stringify(arg)))
.catch(e => console.error('error', e.statusCode))
