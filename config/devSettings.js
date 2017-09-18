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
  azure: {
    queueName: 'lms-elena',
    csvBlobName: 'dev-lms-csv',
    host: 'lms-queue.servicebus.windows.net',
    SharedAccessKeyName: 'RootManageSharedAccessKey'
  },
  localFile: {
    csvDir: '/tmp/'
  }
}
