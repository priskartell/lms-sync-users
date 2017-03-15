var test = require('tape')
const {handleMessages} = require('././utils')
const canvasApi = require('../../canvasApi')
const randomstring = require('randomstring')

function processMessage (message, course) {
  // First create a fresch course in canvas
  let canvasCourse
  return canvasApi.createCourse({course}, 14) // Courses that starts with an 'A' is handled by account 14
  .catch(err => console.error(err))
  .then(res => { canvasCourse = res })
  .then(() => handleMessages(message))
  .then(([{resp}]) => canvasApi.pollUntilSisComplete(resp.id))
  .then(() => canvasApi.getEnrollments(canvasCourse.id))
  .then(([enrolledUser]) => enrolledUser)
}


test('should enroll an assistant in an existing course in canvas', t => {
  t.plan(1)

  const courseCode = 'A' + randomstring.generate(5)
  const userKthId = 'u1znmoik'
  const message = {
    ugClass: 'group',
    ug1Name: `edu.courses.SF.${courseCode}.20171.1.assistants`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode,
    'sis_course_id': `${courseCode}VT171`
  }

  processMessage(message, course)
  .then((enrolledUser) => {
    t.equal(enrolledUser.sis_user_id, userKthId)
  })
})

test('should enroll a re-registered student in an existing course in canvas', t => {
  t.plan(2)
  const userKthId = 'u1znmoik'
  const courseCode0 = 'A' + randomstring.generate(1)
  const courseCode1 = randomstring.generate(4)

  const message = {
    ugClass: 'group',
    ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.omregistrerade_20171`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode0 + courseCode1,
    'sis_course_id': `${courseCode0 + courseCode1}VT173`
  }

  processMessage(message, course)
  .then(enrolledUser => {
    t.ok(enrolledUser)
    t.equal(enrolledUser.sis_user_id, userKthId)
  })
})

test('should enroll a student in an existing course in canvas', t => {
  t.plan(2)

  const courseCode0 = 'A' + randomstring.generate(1)
  const courseCode1 = randomstring.generate(4)
  const userKthId = 'u1znmoik'

  const message = {
    kthid: 'u2yp4zyn',
    ugClass: 'group',
    ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.registrerade_20171.1`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode0 + courseCode1,
    'sis_course_id': `${courseCode0 + courseCode1}VT171`
  }

  processMessage(message, course)
  .then((enrolledUser) => {
    t.ok(enrolledUser)
    t.equal(enrolledUser.sis_user_id, userKthId)
  })
})
