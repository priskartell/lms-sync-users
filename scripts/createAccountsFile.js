const canvasApi = require('../canvasApi')
const Promise = require('bluebird')
const fs = require('fs')

const csvFile = require('../csvFile')

const fileName = 'accounts.csv'

try {
  fs.unlinkSync(fileName)
} catch (e) {
  console.log('couldnt delete file. It probably doesnt exist.', e)
}


/*
{ id: 8,
  name: 'STH',
  workflow_state: 'active',
  parent_account_id: 1,
  root_account_id: 1,
  default_storage_quota_mb: 2000,
  default_user_storage_quota_mb: 50,
  default_group_storage_quota_mb: 50,
  default_time_zone: 'Europe/Stockholm',
  sis_account_id: null,
  sis_import_id: null,
  integration_id: null } [ { id: 29,
    name: 'Imported course rounds',
    workflow_state: 'active',
    parent_account_id: 8,
    root_account_id: 1,
    default_storage_quota_mb: 2000,
    default_user_storage_quota_mb: 50,
    default_group_storage_quota_mb: 50,
    default_time_zone: 'Europe/Stockholm',
    sis_account_id: null,
    sis_import_id: null,
    integration_id: null },
  { id: 37,
    name: 'Manually created course rounds',
    workflow_state: 'active',
    parent_account_id: 8,
    root_account_id: 1,
    default_storage_quota_mb: 2000,
    default_user_storage_quota_mb: 50,
    default_group_storage_quota_mb: 50,
    default_time_zone: 'Europe/Stockholm',
    sis_account_id: null,
    sis_import_id: null,
    integration_id: null },
  { id: 45,
    name: 'Sandboxes',
    workflow_state: 'active',
    parent_account_id: 8,
    root_account_id: 1,
    default_storage_quota_mb: 2000,
    default_user_storage_quota_mb: 50,
    default_group_storage_quota_mb: 50,
    default_time_zone: 'Europe/Stockholm',
    sis_account_id: null,
    sis_import_id: null,
    integration_id: null } ]
*/


const columns = [
  'account_id', // 	text 	Required field. A unique identifier used to reference accounts in the enrollments data. This identifier must not change for the account, and must be globally unique. In the user interface, this is called the SIS ID.
  'parent_account_id', // 	text 	Required column. The account identifier of the parent account. If this is blank the parent account will be the root account. Note that even if all values are blank, the column must be included to differentiate the file from a group import.
  'name', // 	text 	Required field. The name of the account
  'status']

function writeLine(subAccount, subSubAccount) {
  return csvFile.writeLine([`${subAccount.name}-${subSubAccount.name}`, subAccount.id,subSubAccount.name,'active'],fileName)
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
