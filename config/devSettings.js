module.exports = {
  port: 3000,
  canvas: {
    // apiUrl: 'https://kth.beta.instructure.com/api/v1'
    apiUrl: 'https://kth.test.instructure.com/api/v1'
  },
  logging: {
    log: {
      level: 'debug',
      src: true
    },
    stdout: {
      enabled: true
    },
    console: {
      enabled: true
    }
  },
  // azure: {
  //   queueName: 'lms-elena',
  //   csvBlobName: 'dev-lms-csv',
  //   host: 'kth-integral.servicebus.windows.net',
  //   SharedAccessKeyName: 'canvas-consumer'
  //   // host: 'lms-queue.servicebus.windows.net',
  //   // SharedAccessKeyName: 'RootManageSharedAccessKey'
  // },
  azure: {
    queueName: 'ug-infoclass-2/Subscriptions/canvas-prod',
    csvBlobName: 'reflmscsv',
    host: 'kth-integral.servicebus.windows.net',
    SharedAccessKeyName: 'canvas-prod'
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
  },
  localFile: {
    csvDir: '/tmp/'
  }
}
