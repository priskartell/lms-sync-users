const ldap = require('ldapjs')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const config = require('../server/init/configuration')
const attributes = ['ugKthid', 'name']

const ldapClient = Promise.promisifyAll(ldap.createClient({
  url: config.secure.ldap.client.url
}))

function bindLdapClient () {
  return ldapClient.bindAsync(config.secure.ldap.bind.username, config.secure.ldap.bind.password)
}

function getUsersForMembers (members) {
  return Promise.map(members, member => {
    return ldapClient.searchAsync('OU=UG,DC=ug,DC=kth,DC=se', {
      scope: 'sub',
      filter: `(distinguishedName=${member})`,
      timeLimit: 10,
      paging: true,
      attributes,
      paged: {
        pageSize: 1000,
        pagePause: false
      }
    })
  .then(res => new Promise((resolve, reject) => {
    const users = []
    res.on('searchEntry', ({object}) => users.push(object))
    res.on('end', () => resolve(users))
    res.on('error', reject)
  }))
  })
  .then(flatten)
}

function flatten (arr) {
  return [].concat.apply([], arr)
}

function searchGroup (filter) {
  return ldapClient.searchAsync('OU=UG,DC=ug,DC=kth,DC=se', {
    scope: 'sub',
    filter,
    timeLimit: 11,
    paged: true
  })
  .then(res => new Promise((resolve, reject) => {
    res.on('searchEntry', ({object}) => resolve(object.member)) // We will get one result for the group where querying for
    res.on('end', ({object}) => resolve(object && object.member))
    res.on('error', reject)
  }))
  .then(member => {
    // Always use arrays as result
    if (typeof member === 'string') {
      return [member]
    } else {
      return member || []
    }
  })
}

module.exports = {
  bindLdapClient,
  searchGroup,
  getUsersForMembers,
  unbind () {
    return ldapClient.unbindAsync()
  }
}
