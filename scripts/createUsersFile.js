const ldap = require('ldapjs')
const config = require('../server/init/configuration')
const fs = require('fs')

const fileName = 'allUsers.csv'
const headers = ['user_id', 'login_id', 'email', 'full_name', 'status']
const attributes = ['ugKthid', 'ugUsername', 'mail', 'email_address', , 'name']
function escapeCsvData (str) {
  return str
}

function writeLine (strArr, _fileName = fileName) {
  const line = strArr.map(escapeCsvData).join(',') + '\n'
  fs.appendFile(_fileName, line, (err) => {
    if (err) throw err
  })
}

fs.unlinkSync(fileName)
const client = ldap.createClient({
  url: config.secure.ldap.client.url
})

writeLine(headers, fileName)

const opts = {
  filter: 'ugAffiliation=employee',
  // filter: 'ugAffiliation=student',
  scope: 'sub',
  paged: true,
  sizeLimit: 1000,
  attributes
}

client.bind(config.secure.ldap.bind.username, config.secure.ldap.bind.password, function (err) {
  client.search('OU=UG,DC=ug,DC=kth,DC=se', opts, function (err, res) {
    res.on('searchEntry', function (entry) {
      console.log(entry.object)
      const o = entry.object
      writeLine([o.ugKthid, `${o.ugUsername}@kth.se`, o.mail, o.name, 'active' ])
    })
    res.on('error', function (err) {
      console.error('error: ' + err.message)
    })
    res.on('end', function (result) {
      console.log('End!')
      client.unbind()
    })
  })
})
