const canvasApi = require('../canvasApi')
const Promise = require('bluebird')
const fs = require('fs')

const csvFile = require('../csvFile')

const fileName = 'csv/accounts.csv'

try {
  fs.unlinkSync(fileName)
} catch (e) {
  console.log('couldnt delete file. It probably doesnt exist.', e)
}

const columns = [
  'account_id', // 	text 	Required field. A unique identifier used to reference accounts in the enrollments data. This identifier must not change for the account, and must be globally unique. In the user interface, this is called the SIS ID.
  'parent_account_id', // 	text 	Required column. The account identifier of the parent account. If this is blank the parent account will be the root account. Note that even if all values are blank, the column must be included to differentiate the file from a group import.
  'name', // 	text 	Required field. The name of the account
  'status']

function writeLine(subAccount, subSubAccount) {
  return csvFile.writeLine([`${subAccount.name}-${subSubAccount.name}`, subAccount.name,subSubAccount.name,'active'],fileName)
}

return csvFile.writeLine(columns, fileName)
.then(canvasApi.getRootAccount)
.then(canvasApi.listSubaccounts)
.then(subAccounts => {
  return Promise.map(subAccounts, subAccount => {
    canvasApi.listSubaccounts(subAccount.id)
    .then(subSubAccounts => Promise.map(subSubAccounts, subSubAccount => writeLine(subAccount, subSubAccount)))
//     // .then(subSubAccounts => csvFile.writeLine([],fileName))
//
//     // .then(subSubAccounts => console.log('-----------------', subAccount, subSubAccounts))
  })
})

// .then(arg => console.log('arg', JSON.stringify(arg, null, 2)))
