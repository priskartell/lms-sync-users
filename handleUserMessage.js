const {type} = require('message-type')
const config = require('./server/init/configuration')
const canvasApi = require('./canvasApi')(config.safe.canvas.apiUrl, config.secure.canvas.apiKey)
var Promise = require('bluebird');
var ROOTACCOUNT = null
var _stat = {}


// canvasApi.listUsers()
//    .then(userlist => console.log(JSON.stringify(userlist)))


module.exports = function (msg) {

  console.info ("\nProcessing for msg..... " + msg.ugClass + " " + msg.kthid)
  var affArray = msg.affiliation

  if (affArray.indexOf("employee") >= 0 || affArray.indexOf("student") >= 0)
  {
  var user = {}
   user["pseudonym"] = {"unique_id": msg.kthid + "@kth.se"}
  user["user"] = {"name": msg.given_name + " " + msg.family_name,
    "username": msg.username,
    "email": msg.primary_email,
    "sis-integration-id": msg.kthid}
  if (_stat[msg.kthid] === undefined )
    _stat[msg.kthid] = 1
  _stat[msg.kthid] +=1
 return  canvasApi.getUser(user["pseudonym"])
         .then(msg=>canvasApi.updateUser(user,user["pseudonym"]))
         .catch(err=>{console.log("Error" + JSON.stringify(err),null,4);return canvasApi.createUser(user)})

  }
 else {
    if (affArray.length == 0)
      affArray = "[]"
    console.info ("\nSkipping user, not in the correct affiliation group..... " + msg.ugClass + " " + msg.kthid + ", Affiliation = " + affArray)
    return msg
  }
}