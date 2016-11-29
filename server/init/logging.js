'use strict'

const log = require('kth-node-log')
const config = require('./configuration')
const packageFile = require('../../package.json')
const path = require('path')
const fs = require('fs')

const configuration = config.full.logging
const environment = config.env

let logConfiguration = {
  name: packageFile.name,
  app: packageFile.name,
  env: environment,
  level: configuration.log.level,
  console:{
    enabled: true
  }
}


log.init(logConfiguration)
module.exports = log
