var test = require('tape')
const {handleMessages} = require('././utils')
const canvasApi = require('../../canvasApi')
const randomstring = require('randomstring')

test('should enroll an assistant in an existing course in canvas', t => {
  t.plan(1)
  let canvasCourse

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

  // First create a fresch course in canvas
  canvasApi.createCourse({course}, 14) // Courses that starts with an 'A' is handled by account 14
  .then(res => { canvasCourse = res })
  .then(() => handleMessages(message))
  .then(([{resp}]) => canvasApi.pollUntilSisComplete(resp.id))
  .then(() => canvasApi.getEnrollments(canvasCourse.id))
  .then(([enrolledUser]) => {
    t.ok(enrolledUser.sis_user_id === userKthId)
  })
})

test.only('should enroll a re-registered student in an existing course in canvas', t => {
  t.plan(1)
  let canvasCourse

  const courseCode0 = 'A' + randomstring.generate(1)
  const courseCode1 = randomstring.generate(4)
  const userKthId = 'u1znmoik'

  const message = {
    ugClass: 'group',
    ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.omregistrerade_20171`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode0 + courseCode1,
    'sis_course_id': `${courseCode0 + courseCode1}VT171`
  }

  // First create a fresch course in canvas
  canvasApi.createCourse({course}, 14) // Courses that starts with an 'A' is handled by account 14
  .then(res => { canvasCourse = res })
  .then(() => handleMessages(message))
  .then(([{resp}]) => canvasApi.pollUntilSisComplete(resp.id))
  .then(() => canvasApi.getEnrollments(canvasCourse.id))
  .then(([enrolledUser]) => {
    t.ok(enrolledUser.sis_user_id === userKthId)
  })
})
