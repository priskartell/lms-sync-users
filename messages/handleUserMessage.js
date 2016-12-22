'use strict'

const canvasApi = require('../canvasApi')
require('colors')
const log = require('../server/init/logging')

function isInScope (msg) {
  var affArray = msg.affiliation
  const result = affArray && (affArray.includes('employee') || affArray.includes('student'))
  if (!result) {
    log.info('\nUser is not an employee and not a student, out of the affilication scope. User ' + msg.username + ' ' + msg.kthid + ' with affiliation ' + msg.affiliation)
  }
  return result
}

function convertToCanvasUser (msg) {
  log.info('\nConverting the user-type message to canvasApi format for: ' + msg.username + ' ' + msg.kthid, ' msg affiliation ', msg.affiliation)

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
    log.info('\nIncomplete fields to create user in canvas, skipping. Probably,it is missing a name(given_name, family_name) or a username or kth_id.....', msg)
    return
  }
}

// Should this function be moved into canvasApi instead?
function createOrUpdate (user) {
  return canvasApi.getUser(user.pseudonym.sis_user_id)
        .then(userFromCanvas => {
          log.info('found user in canvas', userFromCanvas)
          log.info('update the user with new values: ', user)
          log.info({'metric.updateUser': 1})
          return userFromCanvas
        })
        .then(userFromCanvas => canvasApi.updateUser(user, userFromCanvas.id))
        .catch(e => {
          if (e.statusCode === 404) {
            log.info('user doesnt exist in canvas. Create it.', user)
            return canvasApi.createUser(user)
            .then(res => {
              log.info('Success! User created', res)
              log.info({'metric.createdUser': 1})
              return res
            })
          } else {
            throw e
          }
        })
}

module.exports = function (msg) {
  const user = convertToCanvasUser(msg)

  if (isInScope(msg) && user) {
    return createOrUpdate(user)
    .then(user => msg)
  } else {
    return Promise.resolve(msg)
  }
}
