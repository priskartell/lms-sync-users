var test = require('tape')
const {handleMessages} = require('././utils')
const canvasApi = require('../../canvasApi')
const randomstring = require('randomstring')
const assert = require('assert')
const {promisify} = require('util')

/**
 * Process a "enrollment" message against a Canvas Course
 */
async function processEnrollmentMessage (message, course) {
  // Create the course
  const ACCOUNT_ID = 14 // Courses starting by "A" are handled by Account 14
  let canvasCourse
  try {
    canvasCourse = await canvasApi.createCourse({course}, ACCOUNT_ID)
    await canvasApi.createDefaultSection(canvasCourse)
  } catch (e) {
    console.error('Error creating the course/section in Canvas', e)
    throw e
  }

  // Process the enrollment message
  try {
    const [{resp}] = await handleMessages(message)
    await canvasApi.pollUntilSisComplete(resp.id)
    const enrolledUsers = await canvasApi.getEnrollments(canvasCourse.id)

    return enrolledUsers[0]
  } catch (e) {
    console.error('An error occured', e)
  }
}

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

  processEnrollmentMessage(message, course)
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

  processEnrollmentMessage(message, course)
    .then((enrolledUser) => {
      t.ok(enrolledUser)
      t.equal(enrolledUser.sis_user_id, userKthId)
    })
})

test('should 𝙣𝙤𝙩 enroll an antagen', async t => {
  const courseCode0 = 'A' + randomstring.generate(1)
  const courseCode1 = randomstring.generate(4)
  const userKthId = 'u1znmoik'

  const message = {
    kthid: 'u2yp4zyn',
    ugClass: 'group',
    ug1Name: `ladok2.kurser.${courseCode0}.${courseCode1}.antagna_20181.1`,
    member: [userKthId]}

  const course = {
    name: 'Emil testar',
    'course_code': courseCode0 + courseCode1,
    'sis_course_id': `${courseCode0 + courseCode1}VT171`
  }

  const accountId = 14 // Courses that starts with an 'A' is handled by account 14
  const canvasCourse = await canvasApi.createCourse({course}, accountId)
  await handleMessages(message)

  // Can't poll since no csv file should have been sent to canvas
  // Add a short sleep (I know, this is really ugly) to make sure that any incorrectly sent csv files are caught
  const delay = promisify(setTimeout)
  await delay(5000)
  const enrolledUsers = await canvasApi.getEnrollments(canvasCourse.id)
  assert.deepEqual(enrolledUsers, [])
  t.end()
})
