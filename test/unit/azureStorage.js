const test = require('tape')

test('should require without connecting to azure', t => {
  const azureStorage = require('../../azureStorage.js')
  t.plan(1)
  t.ok(azureStorage)
})
