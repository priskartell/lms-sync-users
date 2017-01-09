var test = require('tape')
const {deleteEveryUserInCanvas} = require('./utils')

test.only('should create a user in canvas', t => {
  t.plan(1)
  deleteEveryUserInCanvas()
  .then(()=>console.log('deleted them!'))
  // Reset canvas
})
