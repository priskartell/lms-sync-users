const config = require('../server/init/configuration')
var test = require('tape')
test.only('should handle type unknown', t => {
  console.log(':::::::::::::::.config:', JSON.stringify(config, null, 4))
})
