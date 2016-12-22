module.exports = {
  port: 3000,
  canvas: {
    apiUrl: 'https://kth.beta.instructure.com/api/v1'
  },
  logging: {
    log: {
      level: 'debug'
    },
    stdout: {
      enabled: true
    },
    console: {
      enabled: false
    }
  },
  azure: {
    queueName: 'ug-canvas-ref',
    csvBlobName: 'reflmscsv',
    msgBlobName: 'reflmsmsg'
  },
  ldap: {
    client: {
      url: 'ldaps://ldap.ug.kth.se',
      timeout: 300000,
      connectTimeout: 3000,
      maxConnections: 10,
      idleTimeout: 300000,
      checkInterval: 10000,
      reconnect: true
    }
  },
  localFile: {
    csvDir: '/tmp/'
  }
}
