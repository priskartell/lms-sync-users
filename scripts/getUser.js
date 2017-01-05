const canvasApi = require('../canvasApi')
canvasApi.getUser('aoeu')
.then(arg => console.log('arg', JSON.stringify(arg)))
.catch(e => console.error('error', e.statusCode))
