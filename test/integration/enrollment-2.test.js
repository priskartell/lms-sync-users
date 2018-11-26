const test = require('tape')
const { handleMessages } = require('./utils')
const canvasApi = require('../../canvasApi')
const randomstring = require('randomstring')

async function createCourse(sisCourseId) {
  const ACCOUNT_ID = 14
  const course = {
    name: `Integration test ${sisCourseId}`,
    course_code: 'Integration test',
    sis_course_id: sisCourseId
  }

  const canvasCourse = await canvasApi.createCourse({course}, ACCOUNT_ID)
  await canvasApi.createDefaultSection(canvasCourse)

  return canvasCourse
}

async function createUser() {
  const kthId = `v${randomstring.generate(7)}`
  const email = `${kthId}@kth.se`
  await canvasApi.createUser({
    pseudonym: {
      unique_id: kthId,
      sis_user_id: kthId,
      skip_registration: true,
      send_confirmation: false
    },
    user: {
      name: 'Integration test',
      sortable_name: 'Integration test'
    },
    communication_channel: {
      type: 'email',
      address: email,
      skip_confirmation: true
    },
    enable_sis_reactivation: false
  })

  return kthId
}


test('should enroll an assistant in an existing course in canvas', async t => {
  t.plan(1)

  // Create the "existing course" and the "assistant" in Canvas
  // Course code should be 6 characters long
  const courseCode = 'A' + randomstring.generate(5)
  const assistantId = await createUser()
  const canvasCourse = await createCourse(courseCode + 'VT171')

  const message = {
    ugClass: 'group',
    ug1Name: `edu.courses.SF.${courseCode}.20171.1.assistants`,
    member: [assistantId]
  }

  const [{resp}] = await handleMessages(message)
  await canvasApi.pollUntilSisComplete(resp.id)
  const enrollments = await canvasApi.getEnrollments(canvasCourse.id)
  t.equal(enrollments[0].sis_user_id , userKthId)
})

test('should enroll an employee in Miljöutbildningen and Canvas at KTH', async t => {
  t.plan(2)
  const muId = 5014 // Miljöutbildningen
  const ckId = 85   // Canvas at KTH

  // Create the "employee" in Canvas
  const employeeId = await createUser()

  const message = {
    ugClass: 'group',
    ug1Name: 'app.katalog3.A',
    member: [employeeId]
  }

  const [{resp}] = await handleMessages(staffMessage)
  await canvasApi.pollUntilSisComplete(resp.id)

  const muEnrollments = await canvasApi.get(`courses/${muId}/enrollments?sis_section_id[]=app.katalog3.A.section1`)
  const ckEnrollments = await canvasApi.get(`courses/${ckId}/enrollments?sis_section_id[]=app.katalog3.A.section1`)

  t.ok(
    muEnrollments.find(e => e.user.sis_user_id === employeeId),
    `The user ${employeeId} is not correctly enrolled in Miljöutbildningen`
  )

  t.ok(
    ckEnrollments.find(e => e.user.sis_user_id === employeeId),
    `The user ${employeeId} is not correctly enrolled in Canvas at KTH`
  )
})
