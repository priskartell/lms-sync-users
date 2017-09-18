module.exports = {
  port: 3000,
  canvas: {
    apiUrl: 'https://kth.instructure.com/api/v1'
  },
  logging: {
    log: {
      level: 'info',
      src: false
    },
    stdout: {
      enabled: true
    },
    console: {
      enabled: false
    }
  },
  azure: {
    queueName: 'ug-infoclass-2/Subscriptions/canvas-prod',
    csvBlobName: 'lms-csv-prod',
    host: 'kth-integral.servicebus.windows.net',
    SharedAccessKeyName: 'canvas-prod'
  },
  localFile: {
    csvDir: '/tmp/'
  }
}
