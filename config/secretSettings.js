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
console.log(getEnv('AZURE_QUEUE_CONNECTION_STRING'), getEnv)

module.exports = {
  secure: {
    ldap: {
      client: {
        url: getEnv('LDAP_URI')
      },
      bind: {
        username: getEnv('LDAP_USERNAME'),
        password: getEnv('LDAP_PASSWORD')
      }
    },
    canvas: {
      apiKey: getEnv('CANVAS_API_KEY')
    },
    azure: {
      SharedAccessKey: getEnv('AZURE_SHARED_ACCESS_KEY'),
      StorageConnectionString: getEnv('AZURE_STORAGE_CONNECTION_STRING')
    }
  }
}
