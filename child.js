let counter = 0

const EventEmitter = require('events')
const eventEmitter = new EventEmitter()

eventEmitter.on('message', msg=>{
  console.log(msg)
})

setTimeout(()=>{
  process.send({event:'detached'})
}, 3000)

setInterval(() => {
  const a = { counter: counter++ }
  eventEmitter.emit('message',a)
  console.log(a)
}, 1000)
