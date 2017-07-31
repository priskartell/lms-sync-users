let counter = 0

setTimeout(()=>{
  process.send({event:'detached'})
}, 3000)

setInterval(() => {
  console.log({ counter: counter++ })
}, 1000)
