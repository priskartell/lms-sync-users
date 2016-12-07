'use strict'

const canvasApi = require('../canvasApi')
require('colors')
const log = require('../server/init/logging')

function isInScope (msg) {
  var affArray = msg.affiliation
  return affArray && (affArray.includes('employee') || affArray.includes('student'))
}

function convertToCanvasUser (msg) {
  // UG_USER_ATTRIBUTES=kthid,username,family_name,given_name,affiliation,email_address,primary_email

  if (msg.username && (msg.given_name || msg.family_name) && msg.kthid) {
    let user = {
      pseudonym: {
        unique_id: `${msg.username}@kth.se`, // CSVs analogi av 'login_id'
        sis_user_id: msg.kthid // CSVs analogi av 'user_id' needed for enrollments
      },
      user: {
        'name': `${msg.given_name} ${msg.family_name}`
      }
    }
    return user
  } else {
    return
  }
}

module.exports = function (msg) {
  log.info('\nProcessing for user msg..... ' + msg.ugClass + ' ' + msg.kthid, ' msg affiliation ', msg.affiliation)

  if (!isInScope(msg)) {
    console.info('\nUser not in affiliation scope..... ' + msg.ugClass + ' ' + msg.kthid)
    return Promise.resolve('User not in affiliation scope...')
  }

  let user = convertToCanvasUser(msg)

  if (!user) {
    console.log('\nIncomplete fields to create user in canvas.....')
    return Promise.resolve('User fields are missing...')
  }

  return canvasApi.getUser(user.pseudonym.sis_user_id)
        .then(userFromCanvas => {
          log.info('found user in canvas', userFromCanvas)
          log.info('update the user with new values: ', user)
          return userFromCanvas
        })
        .then(userFromCanvas => canvasApi.updateUser(user, userFromCanvas.id))
        .catch(e => {
          if (e.statusCode === 404) {
            log.info('user doesnt exist in canvas. Create it.', user)
            return canvasApi.createUser(user)
            .then(res => {
              log.info('user created', res)
              return res
            })
          } else {
            throw e
          }
        })
}
