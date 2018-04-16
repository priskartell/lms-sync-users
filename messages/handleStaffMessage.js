const {writeLine} = require('../csvFile')
const canvasApi = require('../canvasApi')
const fileName = 'staff_enroll.csv'

async function handleStaffMessage (msg) {
  console.log('Handle STAFF')
  // TODO: delete before create
  await writeLine(['section_id', 'user_id', 'role', 'status'], fileName)
  for (let i of [1, 2, 3, 4, 5]) {
    const sisSectionId = `${msg.ug1Name}.section_${i}`
    for (let member of msg.member) {
      await writeLine([sisSectionId, member, msg._desc.userType, 'active'], fileName)
    }
  }
  const canvasReturnValue = await canvasApi.sendCsvFile(fileName, true)
  return {msg, resp: canvasReturnValue}
}

module.exports = {handleStaffMessage}
