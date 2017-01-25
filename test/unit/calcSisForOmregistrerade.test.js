const test = require('tape')
test.only('should do something',t =>{
  const calcSisForOmregistrerade = require('../../messages/calcSisForOmregistrerade');
  const result = calcSisForOmregistrerade({})
  t.ok(result)
  t.end()
})
