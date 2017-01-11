'use strict'

const getEnv = require('kth-node-configuration').getEnv

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
        url: getEnv('LDAP_URI', 'ldaps://ldap.ug.kth.se'),
      },
      bind: {
        username: getEnv('LDAP_USERNAME', 'system.canvas@ug.kth.se'),
        password: getEnv('LDAP_PASSWORD')
      }
    },
    canvas: {
      apiKey: getEnv('CANVAS_API_KEY')
    },
    azure: {
      queueConnectionString: getEnv('AZURE_QUEUE_CONNECTION_STRING', 'Endpoint=sb://kth-integral.servicebus.windows.net/;SharedAccessKeyName=canvas-consumer;SharedAccessKey='),
      queueName: getEnv('AZURE_QUEUE_NAME')
    }
  }
}
