'use strict'

const {getEnv} = require('kth-node-configuration')

/**
 * This configuration file holds all secret information that is used in the local environment.
 * This file is ignored by git.
 */

/**
 * This is the template for the configuration file that holds
 * all secret information that is used in the local environment.
 * This file is checked in to git, but the localSettings.js file each developer
 * should create based on this template is not.
 */

module.exports = {
  secure: {
    ldap: {
      client: {
        url: 'ldaps://ldap.ug.kth.se'
      },
      bind: {
        username: 'system-lms-integration@ug.kth.se',
        password: getEnv('LDAP_PASSWORD')
      }
    },
    canvas: {
      apiKey: getEnv('CANVAS_API_KEY')
    },
    azure: {
      queueName: getEnv('AZURE_QUEUE_NAME'),
      SharedAccessKey: getEnv('AZURE_SHARED_ACCESS_KEY')
    }
  }
}
