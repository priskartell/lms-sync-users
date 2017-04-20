require('kth-node-log').init()
const csvFile = require('../csvFile')
const canvasApi = require('../canvasApi')
const fs = require('fs')

const fileName = 'csv/sections_for_all_courses.csv'
try{
  fs.unlinkSync(fileName)
}catch(err){}

function writeCourseLine (course) {
  course.sis_course_id && csvFile.writeLine([course.sis_course_id, course.sis_course_id,course.name, 'status'], fileName)
}

csvFile.writeLine(['section_id', 'course_id', 'name', 'status'], fileName)
canvasApi.listCourses()
.then(courses => courses.forEach(writeCourseLine))
.then(() => console.log('done.'))
