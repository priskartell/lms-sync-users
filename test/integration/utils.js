const canvasApi = require('../../canvasApi')

module.exports = {
  deleteEveryUserInCanvas(){
    return canvasApi.sendCsvFile('test/integration/files/no_users.csv')
}}
