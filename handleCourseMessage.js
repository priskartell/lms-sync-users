const {type} = require('message-type')
module.exports = function (msg) {
  console.log(msg)
  if (msg._desc && msg._desc.userType === type.students) {
    /*
    TODO:
    1) check if the course exist in canvas
    2a) if the course doesn't exist in canvas, just ignore it
    2b) if the course exist in canvas:build a csv file of the students in the member field and enroll them to the course in canvas
    */
    console.log('TODO: enroll the students', JSON.stringify(msg, null, 4))
  }
  else {
    console.log('this is something else than students, we can probably wait with this until the students is handled', JSON.stringify(msg, null, 4))
  }
  return msg
}
