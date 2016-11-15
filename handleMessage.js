const handleCourseMessage = require('./handleCourseMessage')
const handleUserMessage =  require('./handleUserMessage')
const {type} = require('message-type')

module.exports = function (msg) {
  if (msg._desc && msg._desc.type === type.course) {
    return handleCourseMessage(msg)
  }
  else if (msg._desc && msg._desc.type === type.user) {
    console.log(msg)
    return  handleUserMessage(msg)
  }
  else if (msg._desc && msg._desc.type !== type.unknown) {
    console.warn('this is a known type of message that should be handled:', msg.type)
    console.info(JSON.stringify(msg, null, 4))
    return msg
  }
  else
    return msg
}
