const ldap = require('ldapjs')
const config = require('../server/init/configuration')
const fs = require('fs')
const {writeLine} = require('../csvFile')
const fileName = 'allUsers.csv'
const headers = ['user_id', 'login_id', 'full_name', 'status']
const attributes = ['ugKthid', 'ugUsername', 'mail', 'email_address', 'name', 'ugEmailAddressHR']
const Promise = require('bluebird')

const ldapClient = Promise.promisifyAll(ldap.createClient({
  url: config.secure.ldap.client.url
}))
function appendUsers (type) {
  return new Promise((resolve, reject) => {
    let counter = 0

    const opts = {
      filter: `ugAffiliation=${type}`,
      scope: 'sub',
      paged: true,
      sizeLimit: 1000,
      attributes
    }

    ldapClient.search('OU=UG,DC=ug,DC=kth,DC=se', opts, function (err, res) {
      if (err) {
        throw err
      }
      res.on('searchEntry', function (entry) {
        counter++
        // console.log(entry.object)
        // console.log('.')
        const o = entry.object
        const userName = `${o.ugUsername}@kth.se`
        writeLine([o.ugKthid, userName, o.name, 'active'], fileName)
      })
      res.on('error', function (err) {
        console.error('error: ' + err.message)
      })
      res.on('end', function (result) {
        console.log('Done with ', type, counter)
        resolve()
      })
    })
  })
}

function deleteFile () {
  return fs.unlinkAsync(fileName)
      .catch(e => console.log("couldn't delete file. It probably doesn't exist. This is fine, let's continue"))
}

function bindLdapClient () {
  return ldapClient.bindAsync(config.secure.ldap.bind.username, config.secure.ldap.bind.password)
}

// Run the script

deleteFile()
.then(() => writeLine(headers, fileName))
.then(bindLdapClient)
.then(() => Promise.all([
  appendUsers('employee'),
  appendUsers('student')]))
.then(result => ldapClient.unbind())
.then(() => console.log('Done with creating the file', fileName))
