const handleCourseMessage = require('./handleCourseMessage')
const {type} = require('message-type')

module.exports = function (msg) {
  if (msg._desc && msg._desc.type === type.course) {
    return handleCourseMessage(msg)
  }
  else if (msg._desc && msg._desc.type === type.user) {
    console.log('TODO: CREATE THE USER IN CANVAS')
    return msg
  }
  else if (msg._desc && msg._desc.type !== type.unknown) {
    console.log('this is a known type of message that should be handled:', msg.type)
    console.log(JSON.stringify(msg, null, 4))
    return msg
  } else {
    console.log('unknown message, do nothing');
    return msg
  }
}
