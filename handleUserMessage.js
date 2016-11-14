const {type} = require('message-type')
const config = require('./server/init/configuration')
const canvasApi = require('./canvasApi')(config.safe.canvas.apiUrl, config.secure.canvas.apiKey)
var Promise = require('bluebird');


// canvasApi.listUsers()
//    .then(userlist => console.log(JSON.stringify(userlist)))


module.exports = function (msg) {
    console.info ("\nProcessing for msg..... " + msg.ugClass + " " + msg.kthid)
  var affArray = msg.affiliation

  if (affArray.indexOf("employee") >= 0 || affArray.indexOf("student") >= 0)
  {
    const user = {
      pseudonym: {unique_id: `${msg.username}@kth.se`}, // CSVs analogi av 'login_id'
      user: {
        name: `${msg.given_name} ${msg.family_name}`, // CSVs analogi av 'full_name'
        username: msg.username, //inte säker
        email: msg.primary_email,
        sis-integration-id: msg.kthid //prova om det är rätt analog av CSVs 'user_id'
      }

  return canvasApi.updateUser(user, user.pseudonym.unique_id)
      .catch(e => canvasApi.createUser(user))
      .then(user => {
        console.log(`${user.pseudonym.unique_id} is created in canvas`)
      })
  }
 else {
    if (affArray.length == 0)
      affArray = "[]"
    console.info ("\nSkipping user, not in the correct affiliation group..... " + msg.ugClass + " " + msg.kthid + ", Affiliation = " + affArray)
    return msg
  }
}
