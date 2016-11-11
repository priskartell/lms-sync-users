const {type} = require('message-type')
const config = require('./server/init/configuration')
const canvasApi = require('./canvasApi')(config.safe.canvas.apiUrl, config.secure.canvas.apiKey)
var Promise = require('bluebird');
var ROOTACCOUNT = null
var _stat = {}


canvasApi.getRootAccount()
    .then(rootAccount => {console.log('\nJust verifying that we can talk to canvas.', rootAccount); return ROOTACCOUNT = rootAccount})


module.exports = function (msg) {

  console.info ("\nProcessing for msg..... " + msg.ugClass + " " + msg.kthid)
  var user = {}
   user["pseudonym"] = msg.kthid
  //user["pseudonym"] = msg.username + "@kth.se"
  user["user"] = {"name": msg.given_name + " " + msg.family_name,
    "username": msg.username,
    "email": msg.primary_email,
    "sis-integration-id": msg.kthid}
  if (_stat[msg.kthid] === undefined )
    _stat[msg.kthid] = 1
  _stat[msg.kthid] +=1
 return  canvasApi.createUser(user).then(msg=>console.info(msg))

}