const canvasApi = require('../../canvasApi')
const INTEGRATION_TEST_TERM = 'Integration_test_term'

const consumeMessages = require('../../messages/consumeMessages')

function createTestTerm () {
  return canvasApi.requestCanvas('accounts/1/terms', 'POST', {enrollment_term: {
    'sis_term_id': INTEGRATION_TEST_TERM,
    'name': 'VT 2017',
    'start_at': new Date(),
    'end_at': new Date(),
    'workflow_state': 'active'
  }}).catch(error=>console.log('couldnt create term. It probably already exist'))
}

module.exports = {
  simulateQueueMessage(){

    return
  },

  deleteEveryUserInCanvas () {
    return createTestTerm()
    .then(()=>canvasApi.sendCsvFile('test/integration/files/no_users.csv', 1, {batch_mode:1, batch_mode_term_id:INTEGRATION_TEST_TERM}))
  }}
