const handleCourseMessage = require('./handleCourseMessage')
const handleUserMessage =  require('./handleUserMessage')
const {type} = require('message-type')

module.exports = function (msg) {
  var tmp = Promise.resolve()
  if (msg._desc && msg._desc.type === type.course) {
    return handleCourseMessage(msg)
  }
  else if (msg._desc && msg._desc.type === type.user) {
    console.log(msg)
    return  handleUserMessage(msg)
  }
  else if (msg._desc && msg._desc.type !== type.unknown) {
    console.warn('this should never happen:', msg.type)
    console.info(JSON.stringify(msg, null, 4))
    return Promise.resolve()
  }
  else {
    console.warn('unkown type:', msg._desc.type )
    JSON.stringify(msg, null, 4)
    return Promise.resolve()
  }
}
