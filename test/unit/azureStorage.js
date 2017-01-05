const test = require('tape')

const proxyquire = require('proxyquire').noCallThru()
test.only('should require without connecting to azure', t=>{
  const azureStorage = proxyquire('../../azureStorage.js', {'azure':{createBlobService:()=>Promise.resolve()}})
  t.plan(1)
  t.assert(1,1)

})
