const {writeLine} = require('../csvFile')
const canvasApi = require('../canvasApi')
const config = require('../config')
const fileName = `${config.localFile.csvDir}/staff_enroll.csv`
const {promisify} = require('util')
const unlink = promisify(require('fs').unlink)
const logging = require('../server/logging')

async function handleStaffMessage (msg) {
  // TODO: delete before create
  try {
    await unlink(fileName)
  } catch (e) {
    logging.info('Couldnt delete file. This is fine.')
  }

  await writeLine(['section_id', 'user_id', 'role', 'status'], fileName)
  for (let i of [1, 2, 3, 4, 5]) {
    const sisSectionId = `${msg.ug1Name}.section${i}`
    for (let member of msg.member) {
      await writeLine([sisSectionId, member, msg._desc.userType, 'active'], fileName)
    }
  }
  const canvasReturnValue = await canvasApi.sendCsvFile(fileName, true)
  return {msg, resp: canvasReturnValue}
}

module.exports = {handleStaffMessage}
