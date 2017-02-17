process.env['NODE_ENV'] = 'development'
const config = require('../server/init/configuration.js')
const CanvasApi = require('kth-canvas-api')
const canvasApi = new CanvasApi(config.full.canvas.apiUrl, config.secure.canvas.apiKey)
require('colors')
const ldap = require('ldapjs')
const Promise = require('bluebird')
const {without} = require('lodash');
const attributes = ['ugKthid', 'ugUsername']

const ldapClient = Promise.promisifyAll(ldap.createClient({
  url: config.secure.ldap.client.url
}))

const opts = {
  filter: `ugAffiliation=member`,
  scope: 'sub',
  paged: true,
  sizeLimit: 1000,
  attributes
}

const ugUsers = ldapClient.bindAsync(config.secure.ldap.bind.username, config.secure.ldap.bind.password)
.then(() => ldapClient.searchAsync('OU=UG,DC=ug,DC=kth,DC=se', opts))
.then(res => new Promise((resolve, reject) => {
  const result = []
  res.on('searchEntry', ({object}) => result.push(object.ugKthid))
  res.on('error', reject)
  res.on('end', ()=>resolve(result))
}))
.then(ugUsers=>{
  ldapClient.unbindAsync()
  return ugUsers
})

Promise.all([canvasApi.listUsers().map(canvasUser => canvasUser.sis_user_id), ugUsers])
// .then(([canvasUsers, ugUsers])=>console.log(canvasUsers, ugUsers))
.then(([canvasUsers, ugUsers])=>without(canvasUsers, ...ugUsers))
.then(canvasUsersNotInUg => console.log(canvasUsersNotInUg.length))
.catch(e => console.error(e))
