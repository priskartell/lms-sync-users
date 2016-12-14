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
  'account_id',
  'parent_account_id',
  'name',
  'status']

function writeLine (subAccount, subSubAccount) {
  return csvFile.writeLine([`${subAccount.name}-${subSubAccount.name}`, subAccount.name, subSubAccount.name, 'active'], fileName)
}

csvFile.writeLine(columns, fileName)
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
