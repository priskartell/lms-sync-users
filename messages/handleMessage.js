'use strict'

const handleCourseMessage = require('./handleCourseMessage')
const handleUserMessage = require('./handleUserMessage')
const {type} = require('message-type')
const log = require('../server/init/logging')

module.exports = function (msg) {
  log.info({'metric.handleMessage':1})
  if (msg._desc.type === type.course) {
    log.info('\nStarted handling message to update a course info...'.green)
    return handleCourseMessage(msg)
  } else if (msg._desc.type === type.user) {
    log.info('\nStarted handling the queue message to create/update a user...'.green)
    return handleUserMessage(msg)
  } else {
    return Promise.resolve('This message type is irrelevant for this app.....')
  }
}
