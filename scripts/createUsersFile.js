const ldap = require('ldapjs')
const config = require('../server/init/configuration')

const client = ldap.createClient({
  url: config.secure.ldap.client.url
})

const opts = {
  filter: 'objectClass=user',
  scope: 'sub',
  paged: true,
  sizeLimit: 200
  // attributes: ['dn', 'sn', 'cn']
}
console.log(config.secure.ldap.username)
client.bind(config.secure.ldap.bind.username, config.secure.ldap.bind.password, function (err) {
  console.log('connected,', err)

  client.search('OU=UG,DC=ug,DC=kth,DC=se', opts, function (err, res) {
    res.on('searchEntry', function (entry) {
      // process.stdout.write('.')

      console.log('entry: ' + JSON.stringify(entry.object, null, 4))
      client.unbind()
    })
    res.on('searchReference', function (referral) {
      console.log('referral: ' + referral.uris.join())
    })
    res.on('error', function (err) {
      console.error('error: ' + err.message)
    })
    res.on('end', function (result) {
      console.log('status: ' + result.status)
      client.unbind()
    })
  })
})
