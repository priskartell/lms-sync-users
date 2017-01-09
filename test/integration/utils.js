const canvasApi = require('../../canvasApi')

module.exports = {
  deleteEveryUserInCanvas () {
    createTerm(){
      return canvasApi.requestCanvas('accounts/1/terms', 'POST', {})
    },
    return canvasApi.sendCsvFile('test/integration/files/no_users.csv', 1, {batch_mode:1, batch_mode_term_id:1})
  }}
