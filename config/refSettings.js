module.exports = {
  port: 3000,
  canvas: {
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
      enabled: false
    }
  },
  azure: {
    queueName: 'ug-canvas-ref/Subscriptions/canvas-ref',
    csvBlobName: 'reflmscsv',
    host: 'kth-integral-ref.servicebus.windows.net',
    SharedAccessKeyName: 'canvas'
  },
  localFile: {
    csvDir: '/tmp/'
  }
}
