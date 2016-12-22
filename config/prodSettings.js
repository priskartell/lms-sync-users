module.exports = {
  port: 3000,
  canvas: {
    apiUrl: 'https://kth.instructure.com/api/v1'
  },
  logging: {
    log: {
      level: 'info'
    },
    stdout: {
      enabled: true
    },
    console: {
      enabled: false
    }
  },
  ldap: {
    client: {
      url: 'ldaps://ldap.ug.kth.se',
      timeout: 300000,
      connectTimeout: 3000,
      maxConnections: 10,
      idleTimeout: 300000,
      checkInterval: 10000,
      'reconnect': true
    }
  }, azure: {
    queueName: 'ug-canvas',
    csvBlobName: 'lms-csv-prod',
    msgBlobName: 'lms-msg-ref'
  },
  localFile: {
    csvDir: '/tmp/'
  }
}
