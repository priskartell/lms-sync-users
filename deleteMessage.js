'use strict'

module.exports = function (message, queue) {
  console.log('Started delete at: ', new Date())
  const promise = queue.deleteMessageFromQueue(message)
  console.log('Finished delete at: ', new Date())
  return promise
}
