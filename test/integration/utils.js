const canvasApi = require('../../canvasApi')
const INTEGRATION_TEST_TERM = 'Integration_test_term'

function createTestTerm () {}

module.exports = {
  simulateQueueMessage () {
    return
  },

  deleteEveryUserInCanvas () {
    return createTestTerm()
    .then(() => canvasApi.sendCsvFile('test/integration/files/no_users.csv', 1, {batch_mode: 1, batch_mode_term_id: INTEGRATION_TEST_TERM}))
  }}
